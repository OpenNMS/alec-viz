import {TestBed} from '@angular/core/testing';

import {MeasurementService} from './measurement.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {KPI, KPIType} from './model.service';

describe('MeasurementService', () => {
  let measurementService: MeasurementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    measurementService = TestBed.get(MeasurementService);
    httpMock = TestBed.get(HttpTestingController);
  });

  it('should be created', () => {
    const service: MeasurementService = TestBed.get(MeasurementService);
    expect(service).toBeTruthy();
  });

  it('should successfully get kpi value', (done) => {

    const kpi = new KPI();
    kpi.label = 'mem';
    kpi.type = 'memType';

    const kpiType = new KPIType();
    kpiType.name = 'memType';
    kpiType.attribute = 'percentfree';
    kpiType.query = {};

    measurementService.getKpiValueWithType(kpi, kpiType)
      .subscribe(kpiValue => {
        expect(kpiValue.label).toBe('mem');
        expect(kpiValue.value).toBeCloseTo(255.1, 0.001);
        done();
      });

    const measurementRequest = httpMock.expectOne('http://localhost:8980/opennms/rest/measurements');
    measurementRequest.flush({
      'step': 300000,
      'start': 1546224356262,
      'end': 1546231556262,
      'timestamps': [1546224900000, 1546225200000, 1546225500000, 1546225800000, 1546226100000, 1546226400000, 1546226700000,
        1546227000000, 1546227300000, 1546227600000, 1546227900000, 1546228200000, 1546228500000, 1546228800000, 1546229100000,
        1546229400000, 1546229700000, 1546230000000, 1546230300000, 1546230600000, 1546230900000, 1546231200000, 1546231500000,
        1546231800000],
      'labels': ['percentfree'],
      'columns': [{
        'values': ['NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 'NaN',
          'NaN', 'NaN', 'NaN', 'NaN', 'NaN', 255.1, 'NaN']
      }],
      'constants': []
    });
    httpMock.verify();
  });
});
