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

package org.opennms.oce.graphserver.model;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Lists;

public class Graph {

    private final GraphMetadata graphMetadata;
    private final List<Vertex> vertices;
    private final List<Edge> edges;
    private final List<Layer> layers;

    public Graph(GraphMetadata graphMetadata, Collection<Vertex> vertices, Collection<Edge> edges, Collection<Layer> layers) {
        this.graphMetadata = Objects.requireNonNull(graphMetadata);
        this.vertices = Lists.newArrayList(Objects.requireNonNull(vertices));
        this.edges = Lists.newArrayList(Objects.requireNonNull(edges));
        this.layers = Lists.newArrayList(Objects.requireNonNull(layers));
    }

    @JsonIgnore
    public GraphMetadata getGraphMetadata() {
        return graphMetadata;
    }

    public List<Vertex> getVertices() {
        return vertices;
    }

    public List<Edge> getEdges() {
        return edges;
    }

    public List<Layer> getLayers() {
        return layers;
    }

    public static class Vertex {
        private final String id;
        private final String label;
        private final String type;
        private final String layerId;
        private final Map<String,String> attributes;

        public Vertex(String id, String type, String label, String layerId) {
            this(id, type, label, layerId, Collections.emptyMap());
        }

        public Vertex(String id, String type, String label, String layerId, Map<String, String> attributes) {
            this.id = id;
            this.type = type;
            this.label = label;
            this.layerId = layerId;
            this.attributes = ImmutableMap.copyOf(attributes);
        }

        public String getId() {
            return id;
        }

        public String getType() {
            return type;
        }

        public String getLabel() {
            return label;
        }

        @JsonProperty("layer_id")
        public String getLayerId() {
            return layerId;
        }

        public Map<String, String> getAttributes() {
            return attributes;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Vertex vertex = (Vertex) o;
            return Objects.equals(id, vertex.id) &&
                    Objects.equals(label, vertex.label) &&
                    Objects.equals(type, vertex.type) &&
                    Objects.equals(layerId, vertex.layerId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(id, label, type, layerId);
        }

        @Override
        public String toString() {
            return "Vertex{" +
                    "id='" + id + '\'' +
                    ", label='" + label + '\'' +
                    ", type='" + type + '\'' +
                    ", layerId='" + layerId + '\'' +
                    '}';
        }
    }

    public static class Edge {
        private final String id;
        private final String label;
        private final String sourceId;
        private final String targetId;
        private final String type;

        public Edge(String id, String label, String sourceId, String targetId, String type) {
            this.id = Objects.requireNonNull(id);
            this.label = label;
            this.sourceId = Objects.requireNonNull(sourceId);
            this.targetId = Objects.requireNonNull(targetId);
            this.type = type;
        }

        public Edge(String label, String sourceId, String targetId, String type) {
            this.label = label;
            this.sourceId = Objects.requireNonNull(sourceId);
            this.targetId = Objects.requireNonNull(targetId);
            this.type = Objects.requireNonNull(type);
            this.id = String.format("edge-%s-%s-%s", type, sourceId, targetId);
        }

        public String getId() {
            return id;
        }

        public String getLabel() {
            return label;
        }

        @JsonProperty("source_id")
        public String getSourceId() {
            return sourceId;
        }

        @JsonProperty("target_id")
        public String getTargetId() {
            return targetId;
        }

        public String getType() {
            return type;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Edge edge = (Edge) o;
            return Objects.equals(id, edge.id) &&
                    Objects.equals(label, edge.label) &&
                    Objects.equals(sourceId, edge.sourceId) &&
                    Objects.equals(targetId, edge.targetId) &&
                    Objects.equals(type, edge.type);
        }

        @Override
        public int hashCode() {
            return Objects.hash(id, label, sourceId, targetId, type);
        }

        @Override
        public String toString() {
            return "Edge{" +
                    "id='" + id + '\'' +
                    ", label='" + label + '\'' +
                    ", sourceId='" + sourceId + '\'' +
                    ", targetId='" + targetId + '\'' +
                    ", type='" + type + '\'' +
                    '}';
        }
    }

    public static class Layer {
        private final String id;
        private final String label;
        private final String description;
        private final int order;

        public Layer(String id, String label, String description, int order) {
            this.id = id;
            this.label = label;
            this.description = description;
            this.order = order;
        }

        public String getId() {
            return id;
        }

        public String getLabel() {
            return label;
        }

        public String getDescription() {
            return description;
        }

        public int getOrder() {
            return order;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Layer layer = (Layer) o;
            return order == layer.order &&
                    Objects.equals(id, layer.id) &&
                    Objects.equals(label, layer.label) &&
                    Objects.equals(description, layer.description);
        }

        @Override
        public int hashCode() {
            return Objects.hash(id, label, description, order);
        }

        @Override
        public String toString() {
            return "Layer{" +
                    "id='" + id + '\'' +
                    ", label='" + label + '\'' +
                    ", description='" + description + '\'' +
                    ", order=" + order +
                    '}';
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Graph graph = (Graph) o;
        return Objects.equals(graphMetadata, graph.graphMetadata) &&
                Objects.equals(vertices, graph.vertices) &&
                Objects.equals(edges, graph.edges) &&
                Objects.equals(layers, graph.layers);
    }

    @Override
    public int hashCode() {
        return Objects.hash(graphMetadata, vertices, edges, layers);
    }

    @Override
    public String toString() {
        return "Graph{" +
                "graphMetadata=" + graphMetadata +
                ", vertices=" + vertices +
                ", edges=" + edges +
                ", layers=" + layers +
                '}';
    }
}
