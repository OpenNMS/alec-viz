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
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import javax.xml.bind.JAXBException;

import org.opennms.oce.datasource.api.Alarm;
import org.opennms.oce.datasource.api.InventoryObject;
import org.opennms.oce.datasource.api.Situation;
import org.opennms.oce.datasource.jaxb.JaxbUtils;

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
        return fromXmlFiles(Paths.get(base, "oce.alarms.xml").toString(),
                Paths.get(base, "oce.inventory.xml").toString(),
                Paths.get(base, "oce.situations.xml").toString());
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

    public static OceDataset fromXmlFiles(String alarmsIn, String inventoryIn, String situationsIn) {
        try {
            final List<Alarm> alarms = JaxbUtils.getAlarms(Paths.get(alarmsIn));
            final List<InventoryObject> inventory = JaxbUtils.getInventory(Paths.get(inventoryIn));
            final Set<Situation> situations = JaxbUtils.getSituations(Paths.get(situationsIn));
            return new OceDataset(alarms, inventory, situations);
        } catch (IOException|JAXBException e) {
            throw new RuntimeException(e);
        }
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
