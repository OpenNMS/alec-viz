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

import java.util.List;

import org.opennms.oce.graphserver.model.Graph;
import org.opennms.oce.graphserver.model.GraphMetadata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
public class GraphController {

    @Autowired
    private GraphService graphService;

    @RequestMapping("/")
    public List<GraphMetadata> graphs() {
        return graphService.getAvailableGraphs();
    }

    @RequestMapping("/{id}")
    public Graph graph(@PathVariable("id") String id,
                       @RequestParam(value = "time", required = false) Long timestampInMillis,
                       @RequestParam(value = "szl", required = false) Integer szl,
                       @RequestParam(value = "focalPoint", required = false) String focalPoint,
                       @RequestParam(value = "removeInventoryWithNoAlarms", required = false) Boolean removeInventoryWithNoAlarms) {
        final long timestamp = timestampInMillis != null ? timestampInMillis : System.currentTimeMillis();
        final GraphView.Builder graphViewBuilder = GraphView.builder()
                .setTimestampInMillis(timestamp);
        if (szl != null) {
            graphViewBuilder.setSzl(szl);
        }
        if (focalPoint != null) {
            graphViewBuilder.setFocalPoint(focalPoint);
        }
        if (removeInventoryWithNoAlarms != null) {
            graphViewBuilder.setRemoveInventoryWithNoAlarms(removeInventoryWithNoAlarms);
        }
        return graphService.getGraph(id, graphViewBuilder.build());
    }

    @RequestMapping("/{id}/metadata")
    public GraphMetadata graphMetadata(@PathVariable("id") String id) {
        return graphService.getGraphMetadata(id);
    }

}
