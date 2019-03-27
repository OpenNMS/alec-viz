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

import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

import org.opennms.oce.datasource.api.Situation;

public class SituationResults {
    private static final String DEFAULT_SOURCE_NAME = "default";

    private final String source;
    private final boolean isPrimary;
    private final Set<Situation> situations;

    public static Builder builder() {
        return new Builder();
    }

    public SituationResults(Builder builder) {
        this.source = builder.source;
        this.isPrimary = builder.isPrimary;
        this.situations = new LinkedHashSet<>(builder.situations);
    }

    public static class Builder {
        private String source = DEFAULT_SOURCE_NAME;
        private boolean isPrimary = false;
        private Set<Situation> situations;

        public Builder withSource(String source) {
            this.source = Objects.requireNonNull(source, "source cannot be null");
            return this;
        }

        public Builder withSituations(Set<Situation> situations) {
            this.situations = situations;
            return this;
        }

        public Builder withIsPrimary(boolean isPrimary) {
            this.isPrimary = isPrimary;
            return this;
        }

        public SituationResults build() {
            Objects.requireNonNull(situations, "situations are required");
            return new SituationResults(this);
        }
    }

    public String getSource() {
        return source;
    }

    public Set<Situation> getSituations() {
        return situations;
    }

    public boolean isPrimary() {
        return isPrimary;
    }
}
