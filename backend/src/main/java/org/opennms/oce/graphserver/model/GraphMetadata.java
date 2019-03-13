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

import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicLong;

public class GraphMetadata {

    private static final AtomicLong idGenerator = new AtomicLong();

    public static class Builder {
        private String id;
        private String label;
        private String description;
        private TimeMetadata timeMetadata;

        public Builder withId(String id) {
            this.id = id;
            return this;
        }

        public Builder withLabel(String label) {
            this.label = label;
            return this;
        }

        public Builder withDescription(String description) {
            this.description = description;
            return this;
        }

        public Builder withTimeMetadata(Long startMs, Long endMs, List<TemporalAnnotation> annotations) {
            this.timeMetadata = new TimeMetadata(startMs, endMs, annotations);
            return this;
        }

        public GraphMetadata build() {
            return new GraphMetadata(this);
        }

    }

    public static Builder builder() {
        return new Builder();
    }

    private final String id;
    private final String label;
    private final String description;
    private final TimeMetadata timeMetadata;

    private GraphMetadata(Builder builder) {
        this.id = builder.id != null ? builder.id : Long.toString(idGenerator.getAndIncrement());
        this.label = builder.label;
        this.description = builder.description;
        this.timeMetadata = builder.timeMetadata;
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

    public TimeMetadata getTimeMetadata() {
        return timeMetadata;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GraphMetadata that = (GraphMetadata) o;
        return Objects.equals(id, that.id) &&
                Objects.equals(label, that.label) &&
                Objects.equals(description, that.description) &&
                Objects.equals(timeMetadata, that.timeMetadata);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, label, description, timeMetadata);
    }

    @Override
    public String toString() {
        return "GraphMetadata{" +
                "id='" + id + '\'' +
                ", label='" + label + '\'' +
                ", description='" + description + '\'' +
                ", timeMetadata=" + timeMetadata +
                '}';
    }
}
