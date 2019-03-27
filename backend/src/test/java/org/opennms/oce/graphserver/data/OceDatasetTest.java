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

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.number.OrderingComparison.greaterThanOrEqualTo;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import com.google.common.io.Resources;

public class OceDatasetTest {

    @Rule
    public TemporaryFolder temporaryFolder = new TemporaryFolder();

    @Test
    public void canLoadDatasetFromFilesystem() {
        // Copy the sample dataset from the classpath to the filesystem
        copy("sample/sample.alarms.xml", "oce.alarms.xml");
        copy("sample/sample.inventory.xml", "oce.inventory.xml");
        copy("sample/sample.situations.xml", "oce.situations.xml");
        copy("sample/sample.other.situations.xml", "oce.other.situations.xml");

        OceDataset data = OceDataset.oceDataset(temporaryFolder.getRoot().toString());

        // Make sure we've loaded the datas
        assertThat(data.getAlarms(), hasSize(greaterThanOrEqualTo(1)));
        assertThat(data.getInventory(), hasSize(greaterThanOrEqualTo(1)));
        assertThat(data.getSituationsFromPrimaryResultSet(), hasSize(greaterThanOrEqualTo(1)));
        assertThat(data.getSituationResults(), hasSize(equalTo(2)));
    }

    private void copy(String resource, String fileName) {
        try (InputStream is = Resources.getResource(resource).openStream()) {
            Files.copy(is, Paths.get(temporaryFolder.getRoot().getAbsolutePath(), fileName));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
