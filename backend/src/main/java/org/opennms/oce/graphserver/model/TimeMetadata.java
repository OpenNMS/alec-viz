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

public class TimeMetadata {
    private final long startMs;
    private final long endMs;
    private final List<TemporalAnnotation> annotations;

    public TimeMetadata(long startMs, long endMs, List<TemporalAnnotation> annotations) {
        this.startMs = startMs;
        this.endMs = endMs;
        this.annotations = annotations;
    }

    public long getStartMs() {
        return startMs;
    }

    public long getEndMs() {
        return endMs;
    }

    public List<TemporalAnnotation> getAnnotations() {
        return annotations;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TimeMetadata that = (TimeMetadata) o;
        return Objects.equals(startMs, that.startMs) &&
                Objects.equals(endMs, that.endMs) &&
                Objects.equals(annotations, that.annotations);
    }

    @Override
    public int hashCode() {
        return Objects.hash(startMs, endMs, annotations);
    }

    @Override
    public String toString() {
        return "TimeMetadata{" +
                "startMs=" + startMs +
                ", endMs=" + endMs +
                ", annotations=" + annotations +
                '}';
    }

}
