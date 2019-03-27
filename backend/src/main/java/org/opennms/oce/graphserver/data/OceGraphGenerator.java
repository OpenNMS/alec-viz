/*******************************************************************************
 * This file is part of OpenNMS(R).
 *
 * Copyright (C) 2019 The OpenNMS Group, Inc.
 * OpenNMS(R) is Copyright (C) 1999-2019 The OpenNMS Group, Inc.
 *
 * OpenNMS(R) is a registered trademark of The OpenNMS Group, Inc.
 *
 * OpenNMS(R) is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * OpenNMS(R) is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OpenNMS(R).  If not, see:
 *      http://www.gnu.org/licenses/
 *
 * For more information contact:
 *     OpenNMS(R) Licensing <license@opennms.org>
 *     http://www.opennms.org/
 *     http://www.opennms.com/
 *******************************************************************************/

package org.opennms.oce.graphserver.data;

import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.LongSummaryStatistics;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.opennms.oce.datasource.api.Alarm;
import org.opennms.oce.datasource.api.InventoryObject;
import org.opennms.oce.datasource.api.InventoryObjectPeerRef;
import org.opennms.oce.datasource.api.InventoryObjectRelativeRef;
import org.opennms.oce.datasource.api.ResourceKey;
import org.opennms.oce.datasource.api.Severity;
import org.opennms.oce.datasource.api.Situation;
import org.opennms.oce.graphserver.GraphView;
import org.opennms.oce.graphserver.model.Graph;
import org.opennms.oce.graphserver.model.GraphMetadata;
import org.opennms.oce.graphserver.model.TemporalAnnotation;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;

import edu.uci.ics.jung.algorithms.cluster.WeakComponentClusterer;
import edu.uci.ics.jung.graph.DirectedSparseGraph;
import edu.uci.ics.jung.graph.util.EdgeType;

public class OceGraphGenerator {

    public static final String SEVERITY_ATTRIBUTE = "severity";
    public static final String NUMBER_OF_EVENTS_ATTRIBUTE = "numevents";
    public static final String DESCRIPTION_ATTRIBUTE = "descr";
    public static final String CREATED_MS = "createdms";
    public static final String UPDATED_MS = "updatedms";
    public static final String NUMBER_OF_ALARMS_ATTRIBUTE = "numalarms";
    public static final String SOURCE_ATTRIBUTE = "source";
    public static final String INVENTORY_OBJECT_ID_ATTRIBUTE = "ioid";
    public static final String INVENTORY_OBJECT_TYPE_ATTRIBUTE = "iotype";
    public static final String ID_ATTRIBUTE = "id";
    public static final String MATCHES_PRIMARY_ATTRIBUTE = "matchesprimary";

    public static final String INVENTORY_LAYER_ID = "inventory";
    public static final String ALARMS_LAYER_ID = "alarms";
    public static final String SITUATIONS_LAYER_ID = "situations";

    public static final String PRIMARY_SOURCE_NAME = "primary";

    private final OceDataset oceDataset;
    private final GraphMetadata graphMetadata;

    private long startMs;
    private long endMs;
    private List<TemporalAnnotation> temporalAnnotations;

    public OceGraphGenerator(OceDataset oceDataset) {
        this.oceDataset = oceDataset;
        if (oceDataset.getAlarms().isEmpty()) {
            throw new IllegalArgumentException("One or more alarms is required.");
        }
        processGraph();
        graphMetadata = GraphMetadata.builder()
                .withLabel("OCE")
                .withDescription("Graph generated from OCE dataset")
                .withTimeMetadata(startMs, endMs, temporalAnnotations)
                .build();
    }

    private void processGraph() {
        final Set<Long> allTimestamps = new HashSet<>();
        oceDataset.getAlarms().forEach(a -> allTimestamps.add(a.getTime()));
        oceDataset.getSituationsFromPrimaryResultSet().forEach(s -> allTimestamps.add(s.getCreationTime()));

        final LongSummaryStatistics stats = allTimestamps.stream().mapToLong(l -> l).summaryStatistics();
        startMs = stats.getMin();
        endMs = stats.getMax();

        Comparator<Situation> situationComparator = Comparator.comparing(s -> s.getAlarms().size(), Comparator.reverseOrder());
        situationComparator = situationComparator.thenComparing(Situation::getCreationTime, Comparator.reverseOrder());

        // Find the 10 largest situations, and create annotations for these
        temporalAnnotations = oceDataset.getSituationsFromPrimaryResultSet().stream()
                .sorted(situationComparator)
                .limit(10)
                .map(s -> new TemporalAnnotation(s.getCreationTime(), String.format("Situation #%s Created", s.getId())))
                .collect(Collectors.toList());
    }

    private static List<Alarm> sortAlarmsByTime(List<Alarm> alarms) {
        return alarms.stream().sorted(Comparator.comparing(Alarm::getTime).thenComparing(Alarm::getId)).collect(Collectors.toList());
    }

    public long getStartMs() {
        return startMs;
    }

    public long getEndMs() {
        return endMs;
    }

    public List<TemporalAnnotation> getTemporalAnnotation() {
        return ImmutableList.copyOf(temporalAnnotations);
    }

    public GraphMetadata getGraphMetadata() {
        return graphMetadata;
    }

    public Graph getGraph(GraphView graphView) {
        final Map<ResourceKey, Graph.Vertex> verticesByKey = Maps.newLinkedHashMap();

        final List<Graph.Edge> edges = Lists.newLinkedList();
        final List<Graph.Layer> layers = Lists.newLinkedList();

        final Graph.Layer inventoryLayer = new Graph.Layer(INVENTORY_LAYER_ID, "Inventory", "OCE Inventory", 0);
        layers.add(inventoryLayer);
        final Graph.Layer alarmLayer = new Graph.Layer(ALARMS_LAYER_ID, "Alarms", "OCE Alarms", 1);
        layers.add(alarmLayer);
        final Graph.Layer situationLayer = new Graph.Layer(SITUATIONS_LAYER_ID, "Situations", "OCE Situations", 2);
        layers.add(situationLayer);

        // Create vertices for the inventory
        for (InventoryObject io : oceDataset.getInventory()) {
            final ResourceKey key = getResourceKeyFor(io);
            final String label = io.getFriendlyName() != null ? io.getFriendlyName() : io.getId();
            final Graph.Vertex v = new Graph.Vertex(key.toString(), io.getType(), label, inventoryLayer.getId());
            verticesByKey.put(key, v);
        }

        // Now handle the relationships
        // Copied from  org.opennms.oce.graphserver.data.GraphManager
        for (InventoryObject io : oceDataset.getInventory()) {
            final ResourceKey resourceKey = getResourceKeyFor(io);
            final Graph.Vertex vertex = verticesByKey.get(resourceKey);

            // Parent relationships
            final ResourceKey parentResourceKey = getResourceKeyForParent(io);
            if (parentResourceKey != null) {
                final Graph.Vertex parentVertex = verticesByKey.get(parentResourceKey);
                if (parentVertex != null) {
                    final Graph.Edge edge = new Graph.Edge("", vertex.getId(), parentVertex.getId(), "parent");
                    edges.add(edge);
                }
            }

            // Peer relationships
            for (InventoryObjectPeerRef peerRef : io.getPeers()) {
                final ResourceKey peerResourceKey = getResourceKeyForPeer(peerRef);
                final Graph.Vertex peerVertex = verticesByKey.get(peerResourceKey);
                if (peerVertex != null) {
                    final Graph.Edge edge = new Graph.Edge("", vertex.getId(), peerVertex.getId(), "peer");
                    edges.add(edge);
                }
            }

            // Relative relationships
            for (InventoryObjectRelativeRef relativeRef : io.getRelatives()) {
                final ResourceKey relativeResourceKey = getResourceKeyForPeer(relativeRef);
                final Graph.Vertex relativeVertex = verticesByKey.get(relativeResourceKey);
                if (relativeVertex != null) {
                    final Graph.Edge edge = new Graph.Edge("", vertex.getId(), relativeVertex.getId(), "relative");
                    edges.add(edge);
                }
            }
        }

        // Find the alarms that were active at this time
        Map<String, Severity> alarmIdToSeverityMap = new HashMap<>();
        for (Alarm alarm : getActiveAlarmsAt(graphView.getTimestampInMillis())) {
            final ResourceKey ioKey = getInventoryResourceKeyFor(alarm);
            final ResourceKey alarmKey = getAlarmResourceKeyFor(alarm);

            // Create a vertex for the alarm
            final ImmutableMap.Builder<String,String> attributeBuilder = ImmutableMap.<String,String>builder()
                    .put(ID_ATTRIBUTE, alarm.getId())
                    .put(SEVERITY_ATTRIBUTE, alarm.getSeverity().name().toLowerCase())
                    .put(UPDATED_MS, Long.toString(alarm.getTime()))
                    .put(INVENTORY_OBJECT_TYPE_ATTRIBUTE, alarm.getInventoryObjectType())
                    .put(INVENTORY_OBJECT_ID_ATTRIBUTE, alarm.getInventoryObjectId());
            if (alarm.getDescription() != null) {
                attributeBuilder.put(DESCRIPTION_ATTRIBUTE, alarm.getDescription());
            }
            final Map<String,String> attributes = attributeBuilder.build();
            final Graph.Vertex alarmVertex = new Graph.Vertex(alarmKey.toString(), "alarm", alarm.getSummary(), alarmLayer.getId(), attributes);
            verticesByKey.put(alarmKey, alarmVertex);

            final Graph.Vertex ioEdge = verticesByKey.get(ioKey);
            if (ioEdge != null) {
                final Graph.Edge edge = new Graph.Edge("", alarmVertex.getId(), ioEdge.getId(), "alarm-to-io");
                edges.add(edge);
            }
            alarmIdToSeverityMap.put(alarm.getId(), alarm.getSeverity());
        }

        // Find the situations that were active at this time
        final Map<String, String> alarmVertexIdToSituationVertexIdMap = new HashMap<>();
        final List<Situation> activeSituations = getSituationsActiveAt(graphView.getTimestampInMillis());
        for (Situation situation : activeSituations) {
            final ResourceKey situationKey = getSituationResourceKeyFor(situation, PRIMARY_SOURCE_NAME);
            final Graph.Vertex situationVertex = createVertexForSituation(situation, PRIMARY_SOURCE_NAME, alarmIdToSeverityMap);
            verticesByKey.put(situationKey, situationVertex);

            // Add edges to the alarms
            for (Alarm relatedAlarm : situation.getAlarms()) {
                final ResourceKey alarmResourceKey = getAlarmResourceKeyFor(relatedAlarm);
                final Graph.Vertex alarmVertex = verticesByKey.get(alarmResourceKey);
                if (alarmVertex != null) {
                    final Graph.Edge edge = new Graph.Edge("", situationVertex.getId(), alarmVertex.getId(), "situation-to-alarm");
                    edges.add(edge);
                    alarmVertexIdToSituationVertexIdMap.put(alarmVertex.getId(), situationVertex.getId());
                }
            }
        }

        final List<Graph.Vertex> vertices = Lists.newArrayList(verticesByKey.values());

        // Convert to a JUNG graph
        final edu.uci.ics.jung.graph.DirectedGraph<Graph.Vertex, Graph.Edge> jungGraph = new DirectedSparseGraph<>();
        final Map<String, Graph.Vertex> verticesById = new HashMap<>();
        vertices.forEach(v -> {
            jungGraph.addVertex(v);
            verticesById.put(v.getId(), v);
        });
        edges.forEach(e -> {
            jungGraph.addEdge(e, verticesById.get(e.getSourceId()), verticesById.get(e.getTargetId()), EdgeType.DIRECTED);
        });

        // SZL processing
        final edu.uci.ics.jung.graph.DirectedGraph<Graph.Vertex, Graph.Edge> filteredGraph;
        final List<Graph.Vertex> focalPoints;
        if (graphView.getFocalPoint() != null) {
            focalPoints = vertices.stream().filter(v -> v.getLabel().toLowerCase().contains(graphView.getFocalPoint().toLowerCase()))
                    .collect(Collectors.toList());
        } else {
            // No focal point was set, default to using the top 10 situations with the most *active* alarms
            Comparator<Situation> situationComparator = Comparator.comparing(s -> {
                // Determine the number of *active* alarms
                int numActiveAlarms = 0;
                for (Alarm relatedAlarm : s.getAlarms()) {
                    final ResourceKey alarmResourceKey = getAlarmResourceKeyFor(relatedAlarm);
                    if (verticesByKey.containsKey(alarmResourceKey)) {
                        numActiveAlarms++;
                    }
                }
                return numActiveAlarms;
            }, Comparator.reverseOrder());
            situationComparator = situationComparator.thenComparing(Situation::getCreationTime, Comparator.reverseOrder());
            focalPoints = activeSituations.stream()
                    .sorted(situationComparator)
                    .limit(10)
                    .map(s -> verticesByKey.get(getSituationResourceKeyFor(s, PRIMARY_SOURCE_NAME)))
                    .collect(Collectors.toList());
        }

        // Add situations from the other result sets to the graph
        addOtherSituations(jungGraph, alarmIdToSeverityMap, alarmVertexIdToSituationVertexIdMap);

        final Sizzler sizzler = new Sizzler();
        filteredGraph = sizzler.sizzle(jungGraph, focalPoints, graphView.getSzl());

        if (graphView.isRemoveInventoryWithNoAlarms()) {
            prune(filteredGraph);
        }


        if (graphView.getVertexLimit() > 0) {
            // TODO: What to remove?

            // If num situations < limit, then keep, delete oldest
            // If num alarms + num situations < limit, keep, delete oldest
            // If num ios < limit, keep, delete smallest ids -_-
        }

        return new Graph(getGraphMetadata(), filteredGraph.getVertices(), filteredGraph.getEdges(), layers);
    }

    private Graph.Vertex createVertexForSituation(Situation situation, String source, Map<String, Severity> alarmIdToSeverityMap) {
        return createVertexForSituation(situation, source, Collections.emptyMap(), alarmIdToSeverityMap);
    }

    private Graph.Vertex createVertexForSituation(Situation situation, String source, Map<String,String> defaultAttributes, Map<String, Severity> alarmIdToSeverityMap) {
        final ResourceKey situationKey = getSituationResourceKeyFor(situation, source);

        // Determine the max severity of all the related alarms
        Severity maxSeverity = Severity.INDETERMINATE;
        for (Alarm relatedAlarm : situation.getAlarms()) {
            final Severity severity = alarmIdToSeverityMap.getOrDefault(relatedAlarm.getId(), Severity.INDETERMINATE);
            if (severity.getValue() >= maxSeverity.getValue()) {
                maxSeverity = severity;
            }
        }
        Severity maxSeverityPlusOne = Severity.fromValue(Math.min(Severity.CRITICAL.getValue(), maxSeverity.getValue() + 1));

        // Create a vertex for the situation
        final ImmutableMap.Builder<String,String> attributeBuilder = ImmutableMap.<String,String>builder()
                .putAll(defaultAttributes)
                .put(ID_ATTRIBUTE, situation.getId())
                .put(SEVERITY_ATTRIBUTE, maxSeverityPlusOne.name().toLowerCase())
                .put(CREATED_MS, Long.toString(situation.getCreationTime()))
                .put(NUMBER_OF_ALARMS_ATTRIBUTE, Integer.toString(situation.getAlarms().size()))
                .put(SOURCE_ATTRIBUTE, source);
        if (situation.getDiagnosticText() != null) {
            attributeBuilder.put(DESCRIPTION_ATTRIBUTE, situation.getDiagnosticText());
        }
        final Map<String,String> attributes = attributeBuilder.build();
        return new Graph.Vertex(situationKey.toString(), "situation", "situation #" + situation.getId(), SITUATIONS_LAYER_ID, attributes);
    }

    private void addOtherSituations(edu.uci.ics.jung.graph.Graph<Graph.Vertex, Graph.Edge> jungGraph, Map<String, Severity> alarmIdToSeverityMap, Map<String, String> alarmVertexIdToSituationVertexIdMap) {
        // Find the alarms on the graph
        final Map<String, Graph.Vertex> alarmVerticesById = jungGraph.getVertices().stream()
                .filter(v -> v.getLayerId().equals(ALARMS_LAYER_ID))
                .collect(Collectors.toMap(Graph.Vertex::getId, v -> v));
        // Find the situations on the graph
        final Map<String, Graph.Vertex> situationVerticesById = jungGraph.getVertices().stream()
                .filter(v -> v.getLayerId().equals(SITUATIONS_LAYER_ID))
                .collect(Collectors.toMap(Graph.Vertex::getId, v -> v));

        // Retrieve the non-primary situation result sets
        final List<SituationResults> otherSituationResults = oceDataset.getSituationResults().stream()
                .filter(s -> !s.isPrimary())
                .collect(Collectors.toList());

        for (SituationResults situationResults : otherSituationResults) {
            for (Situation situation : situationResults.getSituations()) {
                // Find all of the referenced alarms that are on the graph
                final List<Graph.Vertex> alarmVertices = new LinkedList<>();
                for (Alarm relatedAlarm : situation.getAlarms()) {
                    final ResourceKey alarmKey = getAlarmResourceKeyFor(relatedAlarm);
                    final Graph.Vertex alarmVertex = alarmVerticesById.get(alarmKey.toString());
                    if (alarmVertex != null) {
                        alarmVertices.add(alarmVertex);
                    }
                }

                // Skip situations that don't have alarms in the current graph
                if (alarmVertices.isEmpty()) {
                    continue;
                }

                // Are all of the alarms associated with the same situation in the primary dataset?
                boolean foundSituationForAllAlarms = true;
                Set<String> situationIds = new HashSet<>();
                for (Graph.Vertex alarmVertex : alarmVertices) {
                    final String situationId = alarmVertexIdToSituationVertexIdMap.get(alarmVertex.getId());
                    if (situationId == null) {
                        foundSituationForAllAlarms = false;
                        break;
                    }
                    situationIds.add(situationId);
                }
                // The situation matches the one from the primary dataset?
                boolean matchesPrimarySituation = false;
                if (foundSituationForAllAlarms && situationIds.size() == 1) {
                    // Only match if the primary situation has the same number of alarms (it may have more)
                    final Graph.Vertex primarySituationVertex = situationVerticesById.get(situationIds.iterator().next());
                    if (primarySituationVertex != null) {
                        matchesPrimarySituation = jungGraph.getNeighbors(primarySituationVertex).size() == alarmVertices.size();
                    }
                }

                final Graph.Vertex situationVertex = createVertexForSituation(situation, situationResults.getSource(), ImmutableMap.<String,String>builder()
                        .put(MATCHES_PRIMARY_ATTRIBUTE, Boolean.toString(matchesPrimarySituation))
                        .build(), alarmIdToSeverityMap);
                jungGraph.addVertex(situationVertex);

                // Add edges to the alarms
                for (Graph.Vertex alarmVertex : alarmVertices) {
                    final Graph.Edge edge = new Graph.Edge("", situationVertex.getId(), alarmVertex.getId(), "situation-to-alarm");
                    jungGraph.addEdge(edge, situationVertex, alarmVertex);
                }
            }
        }
    }

    private static boolean prune(edu.uci.ics.jung.graph.Graph<Graph.Vertex, Graph.Edge> jungGraph) {
        boolean didRemove = false;
        WeakComponentClusterer<Graph.Vertex,Graph.Edge> trns = new WeakComponentClusterer<>();
        Set<Set<Graph.Vertex>> clusters = trns.apply(jungGraph);

        for (Set<Graph.Vertex> cluster : clusters) {
            // Find the inventory objects in the cluster
            final Set<Graph.Vertex> iosInCluster = cluster.stream()
                    .filter(v -> v.getLayerId().equals(INVENTORY_LAYER_ID))
                    .collect(Collectors.toSet());

            // Which of these are attached to alarms?
            final Set<Graph.Vertex> verticesWithAlarmsAttached = new HashSet<>();
            for (Graph.Vertex clusterVertex : iosInCluster) {
                if(jungGraph.getIncidentEdges(clusterVertex).stream().anyMatch(e -> e.getType().equals("alarm-to-io"))) {
                    verticesWithAlarmsAttached.add(clusterVertex);
                }
            }

            if (verticesWithAlarmsAttached.isEmpty()) {
                // There are no alarms attached to any vertex in this cluster, remove them all
                for (Graph.Vertex clusterVertex : iosInCluster) {
                    jungGraph.removeVertex(clusterVertex);
                    didRemove = true;
                }
                continue;
            }

            // We have some alarms attached, let's find the "root" vertices in the cluster
            final Set<Graph.Vertex> rootVertices = new HashSet<>();
            for (Graph.Vertex clusterVertex : iosInCluster) {
                // A root has no parents
                if(jungGraph.getOutEdges(clusterVertex).stream().noneMatch(e -> e.getType().equals("parent"))) {
                    rootVertices.add(clusterVertex);
                }
            }

            for (Graph.Vertex clusterVertex : iosInCluster) {
                // Keep a vertex if it has an alarm attached
                if (verticesWithAlarmsAttached.contains(clusterVertex)) {
                    continue;
                }
                // Keep a vertex if it is a root element
                if (rootVertices.contains(clusterVertex)) {
                    continue;
                }
                // Keep a vertex if it has more >= 2 edges (to other IOs)
                if (jungGraph.getIncidentEdges(clusterVertex).size() >= 2) {
                    continue;
                }
                // Remove it
                jungGraph.removeVertex(clusterVertex);
                didRemove = true;
            }
        }
        return didRemove;
    }

    private List<Alarm> getActiveAlarmsAt(long timestampInMs) {
        // Group alarms by id
        final Map<String, List<Alarm>> alarmsById = oceDataset.getAlarms().stream()
                // Must be before the given timestamp
                .filter(a -> a.getTime() < timestampInMs)
                .collect(Collectors.groupingBy(Alarm::getId));

        List<Alarm> activeAlarms = new LinkedList<>();

        // For every alarm, figure out it's last state at the given time
        for (Map.Entry<String, List<Alarm>> entry : alarmsById.entrySet()) {
            List<Alarm> alarmsByTime = sortAlarmsByTime(entry.getValue());
            Alarm lastAlarm = alarmsByTime.get(alarmsByTime.size() -1);
            // Disregard alarms that have been cleared for more than 5 minutes
            long timeSinceLastAlarmInMs = Math.abs(lastAlarm.getTime() - timestampInMs);
            if (lastAlarm.isClear() && timeSinceLastAlarmInMs >= TimeUnit.MINUTES.toMillis(5)) {
                continue;
            }
            // Disregard alarms with no updates in the last 24 hours
            if (timeSinceLastAlarmInMs >= TimeUnit.DAYS.toMillis(1)) {
                continue;
            }
            activeAlarms.add(lastAlarm);
        }

        return activeAlarms;
    }

    private List<Situation> getSituationsActiveAt(long timestampInMs) {
        final Set<String> activeAlarmIds = getActiveAlarmsAt(timestampInMs).stream()
                .map(Alarm::getId)
                .collect(Collectors.toSet());

        return oceDataset.getSituationsFromPrimaryResultSet().stream()
                // Situation must have been created before the given time
                .filter(s -> s.getCreationTime() <= timestampInMs)
                // At least one of the alarms in the situations must be active
                .filter(s -> {
                    final Set<String> alarmIds = s.getAlarms().stream().map(Alarm::getId).collect(Collectors.toSet());
                    return !Sets.intersection(alarmIds, activeAlarmIds).isEmpty();
                })
                .collect(Collectors.toList());
    }

    private static long roundToTick(long time, long tickResolutionMs) {
        return Math.floorDiv(time, tickResolutionMs) * tickResolutionMs;
    }

    private static ResourceKey getResourceKeyFor(InventoryObject io) {
        return ResourceKey.key(io.getType(), io.getId());
    }

    private static ResourceKey getInventoryResourceKeyFor(Alarm alarm) {
        return ResourceKey.key(alarm.getInventoryObjectType(), alarm.getInventoryObjectId());
    }

    private static ResourceKey getAlarmResourceKeyFor(Alarm alarm) {
        return ResourceKey.key("alarm", alarm.getId());
    }

    private static ResourceKey getSituationResourceKeyFor(Situation situation, String source) {
        return ResourceKey.key("situation", source, situation.getId());
    }

    private static ResourceKey getResourceKeyForParent(InventoryObject child) {
        if (child.getParentType() != null && child.getParentId() != null) {
            return ResourceKey.key(child.getParentType(), child.getParentId());
        }
        return null;
    }

    private static ResourceKey getResourceKeyForPeer(InventoryObjectPeerRef peerRef) {
        return ResourceKey.key(peerRef.getType(), peerRef.getId());
    }

    private static ResourceKey getResourceKeyForPeer(InventoryObjectRelativeRef relativeRef) {
        return ResourceKey.key(relativeRef.getType(), relativeRef.getId());
    }
}
