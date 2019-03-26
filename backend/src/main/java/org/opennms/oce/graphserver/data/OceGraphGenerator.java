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

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
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
        oceDataset.getSituations().forEach(s -> allTimestamps.add(s.getCreationTime()));

        final LongSummaryStatistics stats = allTimestamps.stream().mapToLong(l -> l).summaryStatistics();
        startMs = stats.getMin();
        endMs = stats.getMax();

        Comparator<Situation> situationComparator = Comparator.comparing(s -> s.getAlarms().size(), Comparator.reverseOrder());
        situationComparator = situationComparator.thenComparing(Situation::getCreationTime, Comparator.reverseOrder());

        // Find the 10 largest situations, and create annotiations for these
        temporalAnnotations = oceDataset.getSituations().stream()
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

        final Graph.Layer inventoryLayer = new Graph.Layer("inventory", "Inventory", "OCE Inventory", 0);
        layers.add(inventoryLayer);
        final Graph.Layer alarmLayer = new Graph.Layer("alarms", "Alarms", "OCE Alarms", 1);
        layers.add(alarmLayer);
        final Graph.Layer situationLayer = new Graph.Layer("situations", "Situations", "OCE Situations", 2);
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
            final Map<String,String> attributes = ImmutableMap.<String,String>builder()
                    .put("severity", alarm.getSeverity().name().toLowerCase())
                    .build();
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
        final List<Situation> activeSituations = getSituationsActiveAt(graphView.getTimestampInMillis());
        for (Situation situation : activeSituations) {
            final ResourceKey situationKey = getSituationResourceKeyFor(situation);

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
            final Map<String,String> attributes = ImmutableMap.<String,String>builder()
                    .put("severity", maxSeverityPlusOne.name().toLowerCase())
                    .build();
            final Graph.Vertex situationVertex = new Graph.Vertex(situationKey.toString(), "situation", "situation #" + situation.getId(), situationLayer.getId(), attributes);
            verticesByKey.put(situationKey, situationVertex);

            // Add edges to the alarms
            for (Alarm relatedAlarm : situation.getAlarms()) {
                final ResourceKey alarmResourceKey = getAlarmResourceKeyFor(relatedAlarm);
                final Graph.Vertex alarmVertex = verticesByKey.get(alarmResourceKey);
                if (alarmVertex != null) {
                    final Graph.Edge edge = new Graph.Edge("", situationVertex.getId(), alarmVertex.getId(), "situation-to-alarm");
                    edges.add(edge);
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
                    .map(s -> verticesByKey.get(getSituationResourceKeyFor(s)))
                    .collect(Collectors.toList());
        }

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

    private static boolean prune(edu.uci.ics.jung.graph.Graph<Graph.Vertex, Graph.Edge> jungGraph) {
        boolean didRemove = false;
        WeakComponentClusterer<Graph.Vertex,Graph.Edge> trns = new WeakComponentClusterer<>();
        Set<Set<Graph.Vertex>> clusters = trns.apply(jungGraph);

        for (Set<Graph.Vertex> cluster : clusters) {
            // Find the inventory objects in the cluster
            final Set<Graph.Vertex> iosInCluster = cluster.stream()
                    .filter(v -> v.getLayerId().equals("inventory"))
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

        return oceDataset.getSituations().stream()
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

    private static ResourceKey getSituationResourceKeyFor(Situation situation) {
        return ResourceKey.key("situation", situation.getId());
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
