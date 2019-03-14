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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.stream.Collectors;

import org.opennms.oce.graphserver.data.OceDataset;
import org.opennms.oce.graphserver.data.OceGraphGenerator;
import org.opennms.oce.graphserver.model.Graph;
import org.opennms.oce.graphserver.model.GraphMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.google.common.collect.Lists;

@Component
public class GraphService {
    private static final Logger LOG = LoggerFactory.getLogger(GraphService.class);

    private List<OceGraphGenerator> graphGenerators;

    public GraphService() {
        // Create a generatoe for the OCE dataset
        try {
            graphGenerators = Collections.singletonList(new OceGraphGenerator(OceDataset.oceDataset()));
        } catch (Exception e) {
            LOG.warn("Loading the OCE dataset failed. Defaulting to sample dataset. Error: {}", e.getMessage());
            graphGenerators = Collections.singletonList(new OceGraphGenerator(OceDataset.sampleDataset()));
        }
    }

    public List<GraphMetadata> getAvailableGraphs() {
        return graphGenerators.stream().map(OceGraphGenerator::getGraphMetadata).collect(Collectors.toList());
    }

    public Graph getGraph(String id, long timestampInMillis) {
        return graphGenerators.stream()
                .filter(gg -> Objects.equals(gg.getGraphMetadata().getId(), id))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException(id))
                .getGraph(timestampInMillis, true);
    }

}
