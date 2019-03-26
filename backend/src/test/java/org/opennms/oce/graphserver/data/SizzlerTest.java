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

import static org.hamcrest.Matchers.hasSize;
import static org.junit.Assert.assertThat;

import java.util.Arrays;
import java.util.Collections;

import org.junit.Test;
import org.opennms.oce.graphserver.model.Graph;

import edu.uci.ics.jung.graph.DirectedGraph;
import edu.uci.ics.jung.graph.DirectedSparseGraph;
import edu.uci.ics.jung.graph.util.EdgeType;

public class SizzlerTest {

    private Sizzler sizzler = new Sizzler();

    @Test
    public void canApplySzlToEmptyGraph() {
        DirectedGraph<Graph.Vertex, Graph.Edge> g = new DirectedSparseGraph<>();
        DirectedGraph<Graph.Vertex, Graph.Edge> gg = sizzler.sizzle(g, Collections.emptyList(), 0);

        assertThat(gg.getVertices(), hasSize(0));
        assertThat(gg.getEdges(), hasSize(0));
    }

    @Test
    public void canApplySzlToGraph() {
        DirectedGraph<Graph.Vertex, Graph.Edge> g = new DirectedSparseGraph<>();

        Graph.Vertex v1 = new Graph.Vertex("v1", "i1", "n1", "l1");
        g.addVertex(v1);

        // One vertex in focus
        DirectedGraph<Graph.Vertex, Graph.Edge> gg = sizzler.sizzle(g, Arrays.asList(v1), 0);
        assertThat(gg.getVertices(), hasSize(1));
        assertThat(gg.getEdges(), hasSize(0));

        // Add an edge between v1 and v2
        Graph.Vertex v2 = new Graph.Vertex("v2", "i1", "n1", "l1");
        g.addVertex(v2);
        Graph.Edge e_v1_v2 = new Graph.Edge("", v1.getId(), v2.getId(), "v-to-v");
        g.addEdge(e_v1_v2, v1, v2, EdgeType.DIRECTED);

        // Still one vertex in focus
        gg = sizzler.sizzle(g, Arrays.asList(v1), 0);
        assertThat(gg.getVertices(), hasSize(1));
        assertThat(gg.getEdges(), hasSize(0));

        // Now increase the SZL
        gg = sizzler.sizzle(g, Arrays.asList(v1), 1);
        assertThat(gg.getVertices(), hasSize(2));
        assertThat(gg.getEdges(), hasSize(1));

        // We ignore edge direction, so we should get the same results when switching v1 and v2
        gg = sizzler.sizzle(g, Arrays.asList(v2), 1);
        assertThat(gg.getVertices(), hasSize(2));
        assertThat(gg.getEdges(), hasSize(1));
    }
}
