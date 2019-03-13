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

import java.util.Objects;

public class TemporalAnnotation implements Comparable<TemporalAnnotation> {
    private final Long timestamp;
    private final String label;

    public TemporalAnnotation(Long timestamp, String label) {
        this.timestamp = Objects.requireNonNull(timestamp);
        this.label = Objects.requireNonNull(label);
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public String getLabel() {
        return label;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TemporalAnnotation that = (TemporalAnnotation) o;
        return Objects.equals(timestamp, that.timestamp) &&
                Objects.equals(label, that.label);
    }

    @Override
    public int hashCode() {
        return Objects.hash(timestamp, label);
    }

    @Override
    public String toString() {
        return "TemporalAnnotation{" +
                "timestamp=" + timestamp +
                ", label='" + label + '\'' +
                '}';
    }

    @Override
    public int compareTo(TemporalAnnotation o) {
        return this.timestamp.compareTo(o.timestamp);
    }
}
