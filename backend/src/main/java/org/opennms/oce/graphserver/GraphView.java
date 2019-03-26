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

package org.opennms.oce.graphserver;

import java.util.Objects;

/**
 * @author jwhite
 */
public class GraphView {
    public static final int DEFAULT_SZL = 3;
    public static final boolean DEFAULT_REMOVE_INVENTORY_WITH_NO_ALARMS = false;

    private final long timestampInMillis;
    private final int szl;
    private final String focalPoint;
    private final boolean removeInventoryWithNoAlarms;

    public static GraphView.Builder builder() {
        return new Builder();
    }

    private GraphView(Builder builder) {
        this.timestampInMillis = builder.timestampInMillis;
        this.szl = builder.szl;
        this.focalPoint = builder.focalPoint;
        this.removeInventoryWithNoAlarms = builder.removeInventoryWithNoAlarms;
    }

    public static class Builder {
        private Long timestampInMillis;
        private int szl = DEFAULT_SZL;
        private String focalPoint;
        private boolean removeInventoryWithNoAlarms = DEFAULT_REMOVE_INVENTORY_WITH_NO_ALARMS;

        public Builder setTimestampInMillis(long timestampInMillis) {
            this.timestampInMillis = timestampInMillis;
            return this;
        }

        public Builder setSzl(int szl) {
            if (szl < 0) {
                throw new IllegalArgumentException("szl must be >= 0");
            }
            this.szl = szl;
            return this;
        }

        public Builder setFocalPoint(String focalPoint) {
            this.focalPoint = focalPoint;
            return this;
        }

        public Builder setRemoveInventoryWithNoAlarms(boolean removeInventoryWithNoAlarms) {
            this.removeInventoryWithNoAlarms = removeInventoryWithNoAlarms;
            return this;
        }

        public GraphView build() {
            Objects.requireNonNull(timestampInMillis, "timestamp is required");
            return new GraphView(this);
        }
    }

    public long getTimestampInMillis() {
        return timestampInMillis;
    }

    public int getSzl() {
        return szl;
    }

    public String getFocalPoint() {
        return focalPoint;
    }

    public boolean isRemoveInventoryWithNoAlarms() {
        return removeInventoryWithNoAlarms;
    }
}
