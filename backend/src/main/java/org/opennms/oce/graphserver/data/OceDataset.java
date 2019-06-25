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

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import javax.xml.bind.JAXBException;

import org.opennms.alec.datasource.api.Alarm;
import org.opennms.alec.datasource.api.InventoryObject;
import org.opennms.alec.datasource.api.Situation;
import org.opennms.alec.datasource.jaxb.JaxbUtils;

import com.google.common.io.Resources;

public class OceDataset {

    private final List<Alarm> alarms;
    private final List<InventoryObject> inventory;
    private final List<SituationResults> situations;
    private final SituationResults primarySituationResults;

    public OceDataset(List<Alarm> alarms, List<InventoryObject> inventory, Set<Situation> situations) {
        this.alarms = alarms;
        this.inventory = inventory;
        // Wrap the given set of situation, and mark it as the primary set
        this.primarySituationResults = SituationResults.builder()
                .withIsPrimary(true)
                .withSituations(situations)
                .build();
        this.situations = Collections.singletonList(primarySituationResults);
    }

    public OceDataset(List<Alarm> alarms, List<InventoryObject> inventory, List<SituationResults> situations) {
        this.alarms = alarms;
        this.inventory = inventory;

        long numPrimaryResults = situations.stream().filter(SituationResults::isPrimary).count();
        if (numPrimaryResults != 1) {
            throw new IllegalArgumentException("A single primary situation result set is required, got: " + numPrimaryResults);
        }
        this.primarySituationResults = situations.stream().filter(SituationResults::isPrimary).findFirst()
                .orElseThrow(() -> new IllegalStateException("Should not happen."));
        this.situations = new ArrayList<>(situations);
    }

    public static OceDataset sampleDataset() {
        return fromResources("sample/sample.alarms.xml",
                "sample/sample.inventory.xml",
                "sample/sample.situations.xml",
                "sample/sample.other.situations.xml");
    }

    public static OceDataset oceDataset(String base) {
        // Enumerate the situation results
        final List<Path> situationResults = new LinkedList<>();
        situationResults.add(Paths.get(base, "alec.situations.xml"));
        try {
            situationResults.addAll(Files.list(Paths.get(base))
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().endsWith(".situations.xml"))
                    .filter(p -> !p.getFileName().toString().equals("alec.situations.xml"))
                    .collect(Collectors.toList()));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return fromXmlFiles(Paths.get(base, "alec.alarms.xml"),
                Paths.get(base, "alec.inventory.xml"),
                situationResults.toArray(new Path[0]));
    }

    public static OceDataset fromResources(String alarmsIn, String inventoryIn, String... situationsIn) {
        final List<Alarm> alarms;
        final List<InventoryObject> inventory;
        try (InputStream alarmIs = Resources.getResource(alarmsIn).openStream();
             InputStream inventoryIs = Resources.getResource(inventoryIn).openStream()) {
            alarms = JaxbUtils.getAlarms(alarmIs);
            inventory = JaxbUtils.getInventory(inventoryIs);
        }  catch (IOException|JAXBException e) {
            throw new RuntimeException(e);
        }

        final List<SituationResults> situationResults = new ArrayList<>(situationsIn.length);
        boolean isPrimary = true;
        for (String situationsResource : situationsIn) {
            try (InputStream situationsIs = Resources.getResource(situationsResource).openStream()) {
                final Set<Situation> situations = JaxbUtils.getSituations(situationsIs);
                situationResults.add(SituationResults.builder()
                        .withSource(situationsResource)
                        .withIsPrimary(isPrimary)
                        .withSituations(situations)
                        .build());
            }  catch (IOException|JAXBException e) {
                throw new RuntimeException(e);
            }
            isPrimary = false;
        }

        return new OceDataset(alarms, inventory, situationResults);
    }

    public static OceDataset fromXmlFiles(Path alarmsIn, Path inventoryIn, Path... situationsIn) {
        final List<Alarm> alarms;
        final List<InventoryObject> inventory;
        try {
            alarms = JaxbUtils.getAlarms(alarmsIn);
            inventory = JaxbUtils.getInventory(inventoryIn);
        } catch (IOException|JAXBException e) {
            throw new RuntimeException(e);
        }

        final List<SituationResults> situationResults = new ArrayList<>(situationsIn.length);
        boolean isPrimary = true;
        for (Path situationsResource : situationsIn) {
            try {
                final Set<Situation> situations = JaxbUtils.getSituations(situationsResource);
                situationResults.add(SituationResults.builder()
                        .withSource(situationsResource.getFileName().toString())
                        .withIsPrimary(isPrimary)
                        .withSituations(situations)
                        .build());
            } catch (JAXBException|IOException e) {
                throw new RuntimeException(e);
            }
            isPrimary = false;
        }
        return new OceDataset(alarms, inventory, situationResults);
    }

    public List<Alarm> getAlarms() {
        return alarms;
    }

    public List<InventoryObject> getInventory() {
        return inventory;
    }

    public List<SituationResults> getSituationResults() {
        return situations;
    }

    public Set<Situation> getSituationsFromPrimaryResultSet() {
        return primarySituationResults.getSituations();
    }
}
