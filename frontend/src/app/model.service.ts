import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import * as _ from 'lodash';

import {Observable, throwError} from 'rxjs';
import {catchError, concatMap, map, switchMap} from 'rxjs/operators';
import {ContextModel, StateModel, StateService} from './state.service';
import {timer} from 'rxjs/internal/observable/timer';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModelService {

  private contextModel = new ContextModel();
  model$: Observable<Model>;
  modelMetadata$: Observable<ModelMetadata>;
  polledModel$: Observable<Model>;
  load$ = new BehaviorSubject('');
  stateModel = new StateModel();
  pointInTimeMs: number;

  constructor(private http: HttpClient, private stateService: StateService) {
    this.pointInTimeMs = new Date().getTime();

    this.modelMetadata$ = this.http.get(environment.modelUrl + '/metadata').pipe(
      map((e: Response) => {
        return <ModelMetadata>(<unknown>e);
      })
    );

    // See https://blog.strongbrew.io/rxjs-polling/
    this.model$ = this.http.get(environment.modelUrl, {'params': {'time': '' + this.pointInTimeMs}}).pipe(
      map((e: Response) => this.toModel(e))
    );

    this.polledModel$ = this.load$.pipe(
      switchMap(_ => timer(0, 10000).pipe(
        concatMap(__ => {
          const params = {'time': '' + this.pointInTimeMs};
          if (this.contextModel.focalPoint != null) {
            params['focalPoint'] = this.contextModel.focalPoint;
          }
          if (this.contextModel.szl != null) {
            params['szl'] = this.contextModel.szl;
          }
          if (this.contextModel.prune != null) {
            params['removeInventoryWithNoAlarms'] = this.contextModel.prune;
          }
          return this.http.get(environment.modelUrl, {'params': params}).pipe(
            map((e: Response) => this.toModel(e))
          );
        })
        )
      )
    );

    stateService.stateModel$.subscribe(stateModel => {
      this.onStateModelChanged(stateModel);
    });

    stateService.pointInTime$.subscribe(pointInTimeMs => {
      this.onPointInTimeChanged(pointInTimeMs);
    });


    stateService.contextModel$.subscribe(context => {
      this.onContextModelChanged(context);
    });

    this.modelMetadata$.subscribe(modelMetadata => {
      console.log('meta 1: ', modelMetadata.timeMetadata.startMs)
      let minTimeMs = modelMetadata.timeMetadata.startMs;
      let maxTimeMs = modelMetadata.timeMetadata.endMs;
      let midpoint = (minTimeMs + maxTimeMs)/2;
      console.log('mid: ', midpoint)
      this.stateService.setPointInTimeMs(midpoint);
    });

  }

  private onPointInTimeChanged(pointInTimeMs: number) {
    this.pointInTimeMs = pointInTimeMs;
    this.refreshModel();
  }

  private onContextModelChanged(contextModel: ContextModel) {
    this.contextModel = contextModel;
    this.refreshModel();
  }

  private onStateModelChanged(stateModel: StateModel) {
    this.stateModel = stateModel;
    this.refreshModel();
  }

  getModel(): Observable<Model> {
    return this.polledModel$;
  }

  getModelNow(): Observable<Model> {
    return this.model$;
  }

  refreshModel() {
    this.load$.next('');
  }

  getModelMetadata(): Observable<ModelMetadata> {
    return this.modelMetadata$;
  }

  getKpiType(name: string): Observable<KPIType> {
    return this.getKpiTypes().pipe(
      map((types: KPIType[]) => {
        return types.filter(type => type.name === name).shift();
      }),
      catchError((e: any) => throwError(e))
    );
  }

  getKpiTypes(): Observable<KPIType[]> {
    return this.http.get('./assets/kpi-types.json')
      .pipe(
        map((e: Response) => this.toKpiTypes(e)),
        catchError((e: Response) => throwError(e))
      );
  }

  private getRandomSeverityLabel() {
    const severities = ['critical', 'major', 'minor', 'warning', 'normal', 'cleared'];
    return severities[Math.floor(Math.random() * severities.length)];
  }

  private toModel(response: any): Model {
    const model = new Model();

    const verticesById = {};
    if (response.vertices !== undefined) {
      response.vertices.forEach((vertex: Vertex) => {
        if (vertex.kpis === undefined) {
          vertex.kpis = [];
        }

        if (this.stateModel !== undefined) {
          // TODO: Hardcoded layer ids
          if (!this.stateModel.showInventory && vertex.layer_id === 'inventory') {
            return;
          }
          if (!this.stateModel.showAlarms && vertex.layer_id === 'alarms') {
            return;
          }
          if (!this.stateModel.showSituations && vertex.layer_id === 'situations') {
            return;
          }
        }

        verticesById[vertex.id] = vertex;
        model.vertices.push(vertex);
      });
    }
    if (response.edges !== undefined) {
      response.edges.forEach((edge: Edge) => {
        if (edge.source_id in verticesById && edge.target_id in verticesById) {
          model.edges.push(edge);
        }
      });
    }
    if (response.layers !== undefined) {
      response.layers.forEach((layer: Layer) => {
        model.layers.push(layer);
      });
    }

    if (this.stateModel !== undefined) {
      if (this.stateModel.alarmsPerVertex > 0 && this.stateModel.showAlarms) {
        const alarmVerticesToAdd = [];
        const alarmEdgesToAdd = [];

        let n = 1;

        // Add synthetic alarms to all the vertices in the 'alarms' layer
        model.vertices.forEach(v => {
          for (let k = 0; k < this.stateModel.alarmsPerVertex; k++) {
            const alarmVertex = new Vertex();
            alarmVertex.label = 'alarm #' + n;
            alarmVertex.id = 'synalarm-vertex-' + n;
            alarmVertex.type = 'alarm';
            alarmVertex.layer_id = 'alarms';
            alarmVertex.attributes.set('severity', this.getRandomSeverityLabel());
            alarmVerticesToAdd.push(alarmVertex);

            const alarmEdge = new Edge();
            alarmEdge.id = 'synalarm-edge-' + n;
            alarmEdge.source_id = v.id;
            alarmEdge.target_id = alarmVertex.id;
            alarmEdgesToAdd.push(alarmEdge);

            n++;
          }
        });

        const situationVerticesToAdd = [];
        const situationEdgesToAdd = [];

        let numSituations = this.stateModel.situations;
        if (numSituations > 0 && this.stateModel.showSituations) {
          const numAlarms = alarmVerticesToAdd.length;
          if (numSituations > numAlarms) {
            numSituations = 1;
          }
          const numAlarmsPerSituation = Math.floor(numAlarms / numSituations);

          let m = 0;
          for (let situationIndex = 0; situationIndex < this.stateModel.situations; situationIndex++) {
            const situationVertex = new Vertex();
            situationVertex.label = 'situation #' + situationIndex;
            situationVertex.id = 'situation-vertex-' + situationIndex;
            situationVertex.type = 'situation';
            situationVertex.attributes.set('severity', this.getRandomSeverityLabel());
            situationVertex.layer_id = 'situations';
            situationVerticesToAdd.push(situationVertex);

            for (let j = 0; j < numAlarmsPerSituation; j++) {
              const situationEdge = new Edge();
              situationEdge.id = 'situation-edge-' + situationIndex + '-' + m;
              situationEdge.source_id = alarmVerticesToAdd[m].id;
              situationEdge.target_id = situationVertex.id;
              situationEdgesToAdd.push(situationEdge);
              m++;
            }
          }
        }

        model.vertices = model.vertices.concat(alarmVerticesToAdd);
        model.edges = model.edges.concat(alarmEdgesToAdd);

        model.vertices = model.vertices.concat(situationVerticesToAdd);
        model.edges = model.edges.concat(situationEdgesToAdd);

        const layersById = _.groupBy(model.layers, (layer: Layer) => layer.id);
        if (!('alarms' in layersById)) {
          const alarmLayer = new Layer();
          alarmLayer.id = 'alarms';
          alarmLayer.label = 'Alarms';
          alarmLayer.order = 1;
          model.layers.push(alarmLayer);
        }
        if (!('situations' in layersById)) {
          const situations = new Layer();
          situations.id = 'alarms';
          situations.label = 'Alarms';
          situations.order = 1;
          model.layers.push(situations);
        }
      }
    }
    return model;
  }

  private toKpiTypes(response: any): KPIType[] {
    const kpiTypes = [];
    const types = response as any[];
    types.forEach(type => {
      const kpiType = new KPIType();
      kpiType.name = type.name;
      kpiType.attribute = type.attribute;
      kpiType.query = type.query;
      kpiTypes.push(kpiType);
    });
    return kpiTypes;
  }
}

export class KPIType {
  name: string;
  query: any;
  attribute: string;
}

export class KPI {
  label: string;
  type: string;
  resourceId: string;
}

export class Vertex {
  id: any;
  type: string;
  label: string;
  layer_id: any;

  attributes: Map<string, string> = new Map<string, string>();
  kpis: KPI[] = [];
}

export class Edge {
  id: any;
  type: string;
  label: string;
  source_id: any;
  target_id: any;

  attributes: Map<string, string> = new Map<string, string>();
}

export class Layer {
  id: any;
  label: string;
  description: string;
  order: number;
}

export class Model {
  vertices: Vertex[] = [];
  edges: Edge[] = [];
  layers: Layer[] = [];
}

export class TimeMetadataAnnotiation {
  timestamp: number;
  label: string;
}

export class TimeMetadata {
  startMs: number;
  endMs: number;
  annotations: TimeMetadataAnnotiation[] = [];
}

export class ModelMetadata {
  id: any;
  label: string;
  description: string;
  timeMetadata: TimeMetadata;
}
