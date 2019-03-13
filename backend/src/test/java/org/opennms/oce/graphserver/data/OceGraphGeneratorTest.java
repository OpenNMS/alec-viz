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
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.number.OrderingComparison.greaterThanOrEqualTo;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.Test;
import org.opennms.oce.datasource.api.Severity;
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
        assertThat(data.getSituations(), hasSize(greaterThanOrEqualTo(1)));

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

            final Graph g = oceGraphGenerator.getGraph(temporalAnnotation.getTimestamp());
            assertThat(g, notNullValue());
        }

        // Graph after end time should not change
        assertThat(oceGraphGenerator.getGraph(endMs), equalTo(oceGraphGenerator.getGraph(endMs + 1)));

        // Generate the graph at some known time
        final Graph g = oceGraphGenerator.getGraph(1546759375000L);
        assertThat(g.getLayers(), hasSize(3));

        List<Graph.Vertex> vertices = g.getVertices();
        List<Graph.Edge> edges = g.getEdges();

        assertThat(verticesOnLayer(vertices, "inventory"), hasSize(4));
        assertThat(edgesOnLayer(edges, vertices, "inventory"), hasSize(2));
        assertThat(verticesOnLayer(vertices, "alarms"), hasSize(3));
        assertThat(verticesOnLayer(vertices, "situations"), hasSize(1));

        // Perform generic validation
        validateGraph(g);
    }

    @Test
    public void canAddSeverityToAlarmAndSituationVertices() {
        final OceDataset data = OceDataset.sampleDataset();

        // Generate the graph at some known time
        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);
        final Graph g = oceGraphGenerator.getGraph(1546759375000L, true);

        List<Graph.Vertex> vertices = g.getVertices();

        List<Graph.Vertex> alarmsVertices = verticesOnLayer(vertices, "alarms");
        assertThat(alarmsVertices, hasSize(3));
        assertThat(alarmsVertices.get(0).getAttributes().get("severity"), equalTo(Severity.MAJOR.name().toLowerCase()));

        List<Graph.Vertex> situationVersions = verticesOnLayer(vertices, "situations");
        assertThat(situationVersions, hasSize(1));
        assertThat(situationVersions.get(0).getAttributes().get("severity"), equalTo(Severity.CRITICAL.name().toLowerCase()));
    }

    @Test
    public void canRemoveExtraInventoryFromGraph() {
        final OceDataset data = OceDataset.sampleDataset();

        // Generate the graph at some known time
        final OceGraphGenerator oceGraphGenerator = new OceGraphGenerator(data);
        final Graph g = oceGraphGenerator.getGraph(1546759375000L, true);

        List<Graph.Vertex> vertices = g.getVertices();
        assertThat(verticesOnLayer(vertices, "inventory"), hasSize(2));
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
