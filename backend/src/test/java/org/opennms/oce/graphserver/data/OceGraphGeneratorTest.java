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

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.collection.IsIn.isIn;
import static org.hamcrest.number.OrderingComparison.greaterThanOrEqualTo;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.ALARMS_LAYER_ID;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.CREATED_MS;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.DESCRIPTION_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.ID_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.INVENTORY_LAYER_ID;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.INVENTORY_OBJECT_ID_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.INVENTORY_OBJECT_TYPE_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.MATCHES_PRIMARY_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.NUMBER_OF_ALARMS_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.NUMBER_OF_EVENTS_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.PRIMARY_SOURCE_NAME;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.SEVERITY_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.SITUATIONS_LAYER_ID;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.SOURCE_ATTRIBUTE;
import static org.opennms.oce.graphserver.data.OceGraphGenerator.UPDATED_MS;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.hamcrest.Matchers;
import org.junit.Ignore;
import org.junit.Test;
import org.opennms.alec.datasource.api.Severity;
import org.opennms.oce.graphserver.GraphView;
import org.opennms.oce.graphserver.model.Graph;
import org.opennms.oce.graphserver.model.TemporalAnnotation;

public class OceGraphGeneratorTest {

    /*
    @Test
    public void realData() {
        final OceDataset data = OceDataset.cpnDataset();
        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);
        // 1546788116462
        final Graph g = oceGraphGenerator.getGraph(1546788116462L);
        List<Graph.Vertex> vertices = g.getVertices();
        assertThat(verticesOnLayer(vertices, "situations"), hasSize(1));
        // 4739313
    }
       */

    @Test
    public void canBuildGraphForSampleData()  {
        final OceDataset data = OceDataset.sampleDataset();

        // Make sure we've loaded some data
        assertThat(data.getAlarms(), hasSize(greaterThanOrEqualTo(1)));
        assertThat(data.getInventory(), hasSize(greaterThanOrEqualTo(1)));
        assertThat(data.getSituationsFromPrimaryResultSet(), hasSize(greaterThanOrEqualTo(1)));

        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);

        // Validate the time
        final long startMs = oceGraphGenerator.getStartMs();
        final long endMs =  oceGraphGenerator.getEndMs();
        final List<TemporalAnnotation> temporalAnnotations = oceGraphGenerator.getTemporalAnnotation();

        assertThat(startMs, equalTo(1546759312000L));
        assertThat(endMs, equalTo(1546759382000L));

        assertThat(temporalAnnotations, hasSize(greaterThanOrEqualTo(1)));
        for (TemporalAnnotation temporalAnnotation : temporalAnnotations) {
            assertThat(temporalAnnotation.getTimestamp(), greaterThanOrEqualTo(startMs));
            assertThat(temporalAnnotation.getTimestamp(), lessThanOrEqualTo(endMs));

            final GraphView view = GraphView.builder()
                    .setTimestampInMillis(temporalAnnotation.getTimestamp())
                    .build();

            final Graph g = oceGraphGenerator.getGraph(view);
            assertThat(g, notNullValue());
        }

        // Graph after end time should not change
        final GraphView viewAtEnd = GraphView.builder()
                .setTimestampInMillis(endMs + 1)
                .build();
        final GraphView viewAfterEnd = GraphView.builder()
                .setTimestampInMillis(endMs + 1000)
                .build();
        assertThat(oceGraphGenerator.getGraph(viewAtEnd), equalTo(oceGraphGenerator.getGraph(viewAfterEnd)));

        // Generate the graph at some known time
        final GraphView viewAtKnownTime = GraphView.builder()
                .setTimestampInMillis(1546759375000L)
                .build();
        final Graph g = oceGraphGenerator.getGraph(viewAtKnownTime);
        assertThat(g.getLayers(), hasSize(3));

        List<Graph.Vertex> vertices = g.getVertices();
        List<Graph.Edge> edges = g.getEdges();

        assertThat(verticesOnLayer(vertices, INVENTORY_LAYER_ID), hasSize(2));
        assertThat(edgesOnLayer(edges, vertices, INVENTORY_LAYER_ID), hasSize(1));
        assertThat(verticesOnLayer(vertices, ALARMS_LAYER_ID), hasSize(3));
        assertThat(verticesOnLayer(vertices, SITUATIONS_LAYER_ID), hasSize(2));

        // Perform generic validation
        validateGraph(g);
    }

    @Test
    public void canAddSeverityToAlarmAndSituationVertices() {
        final OceDataset data = OceDataset.sampleDataset();

        // Generate the graph at some known time
        final GraphView viewAtKnownTime = GraphView.builder()
                .setTimestampInMillis(1546759375000L)
                .setRemoveInventoryWithNoAlarms(true)
                .build();
        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);
        final Graph g = oceGraphGenerator.getGraph(viewAtKnownTime);

        List<Graph.Vertex> vertices = g.getVertices();

        List<Graph.Vertex> alarmsVertices = verticesOnLayer(vertices, ALARMS_LAYER_ID);
        assertThat(alarmsVertices, hasSize(3));
        assertThat(alarmsVertices.get(0).getAttributes().get(SEVERITY_ATTRIBUTE), equalTo(Severity.MAJOR.name().toLowerCase()));

        List<Graph.Vertex> situationVersions = verticesOnLayer(vertices, SITUATIONS_LAYER_ID);
        assertThat(situationVersions, hasSize(2));
        assertThat(situationVersions.get(0).getAttributes().get(SEVERITY_ATTRIBUTE), equalTo(Severity.CRITICAL.name().toLowerCase()));
    }

    @Test
    public void canAddAttributesToAlarmAndSituationVertices() {
        final OceDataset data = OceDataset.sampleDataset();

        // Generate the graph at some known time
        final GraphView viewAtKnownTime = GraphView.builder()
                .setTimestampInMillis(1546759375000L)
                .setRemoveInventoryWithNoAlarms(true)
                .build();
        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);
        final Graph g = oceGraphGenerator.getGraph(viewAtKnownTime);

        List<Graph.Vertex> vertices = g.getVertices();

        List<Graph.Vertex> alarmsVertices = verticesOnLayer(vertices, ALARMS_LAYER_ID);
        assertThat(alarmsVertices, hasSize(3));
        assertThat(alarmsVertices.get(0).getAttributes().get(ID_ATTRIBUTE), equalTo("4738843"));
        assertThat(alarmsVertices.get(0).getAttributes().get(SEVERITY_ATTRIBUTE), equalTo(Severity.MAJOR.name().toLowerCase()));
        assertThat(alarmsVertices.get(0).getAttributes().get(DESCRIPTION_ATTRIBUTE), equalTo("Port Down due to Oper Status down"));
        assertThat(alarmsVertices.get(0).getAttributes().get(UPDATED_MS), equalTo("1546759352000"));
        assertThat(alarmsVertices.get(0).getAttributes().get(INVENTORY_OBJECT_ID_ATTRIBUTE), equalTo("swmgmt01: Ethernet102/1/22"));
        assertThat(alarmsVertices.get(0).getAttributes().get(INVENTORY_OBJECT_TYPE_ATTRIBUTE), equalTo("PORT"));

        List<Graph.Vertex> situationVersions = verticesOnLayer(vertices, SITUATIONS_LAYER_ID);
        assertThat(situationVersions, hasSize(2));
        assertThat(situationVersions.get(0).getAttributes().get(ID_ATTRIBUTE), equalTo("4738843"));
        assertThat(situationVersions.get(0).getAttributes().get(SEVERITY_ATTRIBUTE), equalTo(Severity.CRITICAL.name().toLowerCase()));
        assertThat(situationVersions.get(0).getAttributes().get(DESCRIPTION_ATTRIBUTE), equalTo(null));
        assertThat(situationVersions.get(0).getAttributes().get(CREATED_MS), equalTo("1546759375000"));
        assertThat(situationVersions.get(0).getAttributes().get(NUMBER_OF_ALARMS_ATTRIBUTE), equalTo("3"));
        // Situation from auxiliary dataset
        assertThat(situationVersions.get(1).getAttributes().get(MATCHES_PRIMARY_ATTRIBUTE), equalTo("false"));
    }

    @Test
    public void canRemoveExtraInventoryFromGraph() {
        final OceDataset data = OceDataset.sampleDataset();

        // Generate the graph at some known time
        final GraphView viewAtKnownTime = GraphView.builder()
                .setTimestampInMillis(1546759375000L)
                .setRemoveInventoryWithNoAlarms(true)
                .build();
        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);
        final Graph g = oceGraphGenerator.getGraph(viewAtKnownTime);

        List<Graph.Vertex> vertices = g.getVertices();
        assertThat(verticesOnLayer(vertices, INVENTORY_LAYER_ID), hasSize(2));
    }

    @Test
    public void canGenerateGraphWithMultipleSituationResults() {
        final OceDataset data = OceDataset.sampleDataset();

        // Make sure we've loaded some data
        assertThat(data.getAlarms(), hasSize(greaterThanOrEqualTo(1)));
        assertThat(data.getInventory(), hasSize(greaterThanOrEqualTo(1)));
        assertThat(data.getSituationsFromPrimaryResultSet(), hasSize(greaterThanOrEqualTo(1)));
        assertThat(data.getSituationResults(), hasSize(2));

        // Generate the graph at some known time
        final GraphView viewAtKnownTime = GraphView.builder()
                .setTimestampInMillis(1546759375000L)
                .setRemoveInventoryWithNoAlarms(true)
                .build();
        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);
        final Graph g = oceGraphGenerator.getGraph(viewAtKnownTime);

        List<Graph.Vertex> vertices = g.getVertices();
        assertThat(verticesOnLayer(vertices, INVENTORY_LAYER_ID), hasSize(2));
        assertThat(verticesOnLayer(vertices, ALARMS_LAYER_ID), hasSize(3));
        assertThat(verticesOnLayer(vertices, SITUATIONS_LAYER_ID), hasSize(2));

        Set<String> uniqueSourceAttributes = verticesOnLayer(vertices, SITUATIONS_LAYER_ID).stream()
                .map(v -> v.getAttributes().get(SOURCE_ATTRIBUTE))
                .collect(Collectors.toSet());
        assertThat(uniqueSourceAttributes, hasSize(2));
        assertThat(PRIMARY_SOURCE_NAME, isIn(uniqueSourceAttributes));
    }

    @Test
    @Ignore
    public void canLoadSnapshot() {
        final OceDataset data = OceDataset.fromResources("alec-snapshot/alec.alarms.xml",
                "alec-snapshot/alec.inventory.xml",
                "alec-snapshot/alec.situations.xml");
        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);

        // Generate the graph at the current time
        final GraphView view = GraphView.builder()
                .setTimestampInMillis(System.currentTimeMillis())
                .setRemoveInventoryWithNoAlarms(true)
                .setFocalPoint("opendaylight")
                .build();
        final Graph g = oceGraphGenerator.getGraph(view);

        List<Graph.Vertex> vertices = g.getVertices();
        assertThat(verticesOnLayer(vertices, INVENTORY_LAYER_ID), hasSize(2));
    }

    /** Generic validation
     */
    private static void validateGraph(Graph g) {
        List<Graph.Vertex> vertices = g.getVertices();
        List<Graph.Edge> edges = g.getEdges();

        // No two vertices should have the same id
        vertices.stream()
                .collect(Collectors.groupingBy(Graph.Vertex::getId))
                .forEach((key, value) -> assertThat("multiple vertices with id: " + key, value, hasSize(equalTo(1))));

        // No two edges should have the same id
        edges.stream()
                .collect(Collectors.groupingBy(Graph.Edge::getId))
                .forEach((key, value) -> assertThat("multiple edges with id: " + key, value, hasSize(equalTo(1))));
    }

    private static List<Graph.Vertex> verticesOnLayer(List<Graph.Vertex> vertices, String layerId) {
        return vertices.stream().filter(v -> Objects.equals(layerId, v.getLayerId())).collect(Collectors.toList());
    }

    private static List<Graph.Edge> edgesOnLayer(List<Graph.Edge> edges, List<Graph.Vertex> vertices, String layerId) {
        final Set<String> vertexIdsOnLayer = verticesOnLayer(vertices, layerId).stream()
                .map(Graph.Vertex::getId).collect(Collectors.toSet());
        return edges.stream()
                .filter(e -> vertexIdsOnLayer.contains(e.getSourceId()) && vertexIdsOnLayer.contains(e.getTargetId()))
                .collect(Collectors.toList());
    }
}
