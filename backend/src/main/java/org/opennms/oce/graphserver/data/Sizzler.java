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

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.opennms.oce.graphserver.model.Graph;

import com.google.common.collect.Lists;

import edu.uci.ics.jung.graph.DirectedGraph;
import edu.uci.ics.jung.graph.DirectedSparseGraph;
import edu.uci.ics.jung.graph.util.EdgeType;

public class Sizzler {

    public DirectedGraph<Graph.Vertex, Graph.Edge> sizzle(DirectedGraph<Graph.Vertex, Graph.Edge> g, List<Graph.Vertex> focalPoints, int szl) {

        // Create a new graph
        final DirectedGraph<Graph.Vertex, Graph.Edge> filteredGraph = new DirectedSparseGraph<>();

        // Start by adding all of the vertices in focus
        for (Graph.Vertex focalPoint : focalPoints) {
            filteredGraph.addVertex(focalPoint);
        }

        final List<Graph.Vertex> alreadyProcessedVertices = new ArrayList<>();

        // Determine all vertices according to szl
        final List<Graph.Vertex> verticesToProcess = Lists.newArrayList(focalPoints);
        for (int i=0; i<szl; i++) {
            final List<Graph.Vertex> tmpVertices = new ArrayList<>();
            for (Graph.Vertex eachVertex : verticesToProcess) {
                final Collection<Graph.Vertex> neighbors = g.getSuccessors(eachVertex);
                for (Graph.Vertex v : neighbors) {
                    filteredGraph.addVertex(v);
                }

                // Mark for procession
                for (Graph.Vertex eachNeighbor : neighbors) {
                    // but only if not already processed or are processing in this iteration
                    if (!alreadyProcessedVertices.contains(eachNeighbor) && !verticesToProcess.contains(eachNeighbor)) {
                        tmpVertices.add(eachNeighbor);
                    }
                }
            }
            alreadyProcessedVertices.addAll(verticesToProcess);
            verticesToProcess.clear();
            verticesToProcess.addAll(tmpVertices);
        }

        // Index the vertices on the filtered graph
        final Map<String, Graph.Vertex> verticesById = new HashMap<>();
        for (Graph.Vertex eachVertex : filteredGraph.getVertices()) {
            verticesById.put(eachVertex.getId(), eachVertex);
        }

        // Process the edges
        for (Graph.Vertex v1 : filteredGraph.getVertices()) {
            for (Graph.Edge e : g.getOutEdges(v1)) {
                final Graph.Vertex v2 = verticesById.get(e.getTargetId());
                if (v2 == null) {
                    continue;
                }
                filteredGraph.addEdge(e, v1, v2, EdgeType.DIRECTED);
            }
        }

        return filteredGraph;
    }
}
