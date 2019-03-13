import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ModelService } from './model.service';

describe('ModelService', () => {
  let modelService: ModelService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
    modelService = TestBed.get(ModelService);
    httpMock = TestBed.get(HttpTestingController);
  });

  it('should be created', () => {
    const service: ModelService = TestBed.get(ModelService);
    expect(service).toBeTruthy();
  });

  it('should successfully get basic model', (done) => {
    modelService.getModelNow()
      .subscribe(model => {
        expect(model.vertices.length).toBe(2);
        expect(model.vertices[0].label).toBe('n1');
        expect(model.vertices[0].id).toBe('1');
        expect(model.vertices[0].type).toBe('node');
        expect(model.vertices[0].layer_id).toBe('nodes');
        expect(model.vertices[1].label).toBe('n2');
        expect(model.vertices[1].id).toBe('2');
        expect(model.vertices[1].type).toBe('alarm');
        expect(model.vertices[1].layer_id).toBe('alarms');

        expect(model.edges.length).toBe(1);
        expect(model.edges[0].id).toBe('1');
        expect(model.edges[0].label).toBe('edge n1-n2');
        expect(model.edges[0].source_id).toBe('1');
        expect(model.edges[0].target_id).toBe('2');

        expect(model.layers.length).toBe(2);
        expect(model.layers[0].id).toBe('nodes');
        expect(model.layers[0].label).toBe('Nodes');
        expect(model.layers[0].description).toBe('All nodes');
        expect(model.layers[0].id).toBe('nodes');
        expect(model.layers[0].order).toBe(0);
        expect(model.layers[1].id).toBe('alarms');
        expect(model.layers[1].label).toBe('Alarms');
        expect(model.layers[1].description).toBe('All alarms');
        expect(model.layers[1].order).toBe(1);
        done();
      });

    const modelRequest = httpMock.expectOne(req => req.method === 'GET' && req.url === './assets/model.json');
    modelRequest.flush({
      'vertices': [
        {'id': '1', 'label': 'n1', 'type': 'node', 'layer_id': 'nodes'},
        {'id': '2', 'label': 'n2', 'type': 'alarm', 'layer_id': 'alarms'},
      ],
      'edges': [
        {'id': '1', 'label': 'edge n1-n2', 'type': 'link', 'source_id': '1', 'target_id': '2'}
      ],
      'layers': [
        {'id': 'nodes', 'label': 'Nodes', 'description': 'All nodes', 'order': 0},
        {'id': 'alarms', 'label': 'Alarms', 'description': 'All alarms', 'order': 1}
      ]
    });
    httpMock.verify();
  });

  it('should successfully get model with kpis', (done) => {
    let asyncCalls = 0;
    modelService.getModelNow()
      .subscribe(model => {
        expect(model.vertices.length).toBe(1);
        const vertex = model.vertices[0];
        expect(vertex.label).toBe('n1');
        expect(vertex.id).toBe(1);
        expect(vertex.kpis.length).toBe(1);

        expect(vertex.kpis[0].label).toBe('mem');
        expect(vertex.kpis[0].type).toBe('memType');
        expect(vertex.kpis[0].resourceId).toBe('node[NODES:n1].interfaceSnmp[jmx-minion]');

        asyncCalls++;
        if (asyncCalls === 2) {
          done();
        }
      });

    modelService.getKpiType('memType')
      .subscribe(type => {
        expect(type.name).toBe('memType');
        expect(type.attribute).toBe('percentfree');
        expect(type.query).toEqual({
          'source': [],
          'expression': []
        });

        asyncCalls++;
        if (asyncCalls === 2) {
          done();
        }
      });

    const modelRequest = httpMock.expectOne(req => req.method === 'GET' && req.url === './assets/model.json');
    modelRequest.flush({
      'vertices': [
        {
          'label': 'n1',
          'id': 1,
          'kpis': [{
            'label': 'mem',
            'type': 'memType',
            'resourceId': 'node[NODES:n1].interfaceSnmp[jmx-minion]'
          }]
        }
      ]
    });

    const kpiTypesRequests = httpMock.expectOne('./assets/kpi-types.json');
    kpiTypesRequests.flush([
        {
          'name': 'memType',
          'attribute': 'percentfree',
          'query': {
            'source': [],
            'expression': []
          }
        }
      ]
    );

    httpMock.verify();
  });
});
