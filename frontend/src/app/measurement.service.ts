import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs/internal/Observable';
import {catchError, flatMap, map} from 'rxjs/operators';
import {throwError} from 'rxjs/internal/observable/throwError';
import {KPI, KPIType, ModelService} from './model.service';
import {LinkUsage} from './scene/endpointlink';
import {of} from 'rxjs/internal/observable/of';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MeasurementService {

  constructor(private http: HttpClient, private modelService: ModelService) { }

  getKpiValue(kpi: KPI): Observable<KPIValue> {
    return this.modelService.getKpiType(kpi.type)
      .pipe(
        flatMap((type: KPIType) => this.getKpiValueWithType(kpi, type))
      );
  }

  getKpiValueWithType(kpi: KPI, type: KPIType): Observable<KPIValue> {
    if (type === undefined) {
      console.warn('No type found for', kpi.type);

      const nilValue = new KPIValue();
      nilValue.label = kpi.label;
      nilValue.value = NaN;
      return Observable.create(nilValue);
    }

    const end = Date.now();
    const start = end - 60 * 60 * 1000; // 1 hour ago
    const step = 5 * 60 * 1000; // 5 minutes

    const query = { ...type.query };
    query.start = start;
    query.end = end;
    query.step = step;
    const source = query.source as any[];
    if (source !== undefined) {
      source.forEach(s => {
        s.resourceId = kpi.resourceId;
      });
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type':  'application/json',
        'Authorization': 'Basic ' +  btoa(environment.opennms.username + ':' + environment.opennms.password)
      })
    };

    return this.http.post<Measurements>(environment.opennms.url + '/rest/measurements', query, httpOptions)
      .pipe(
        map((m: Measurements) => this.toKpiValue(kpi, type, m)),
        catchError((e: any) => throwError(e))
      );
  }

  private toKpiValue(kpi: KPI, type: KPIType, measurements: Measurements): KPIValue {
    const kpiValue = new KPIValue();
    kpiValue.label = kpi.label;
    kpiValue.value = NaN;

    // find the index of the associated label
    const columnIndex = measurements.labels.indexOf(type.attribute);
    if (columnIndex >= 0) {
      const column = measurements.columns[columnIndex];

      // find the last non-nan value
      let k = column.values.length - 1;
      while (k >= 0) {
        if (!isNaN(column.values[k])) {
          kpiValue.value = column.values[k];
        }
        k--;
      }
    }

    return kpiValue;
  }

  getLinkUsage(resourceId: string): Observable<LinkUsage> {
    const linkUsage = new LinkUsage();
    linkUsage.inUsagePercent = 10;
    linkUsage.outUsagePercent = 100;
    return of(linkUsage);
  }
}

export interface MeasurementsColumn {
  values: number[];
}

export interface Measurements {
  step: number;
  state: number;
  end: number;
  timestamps: number[];
  labels: string[];
  columns: MeasurementsColumn[];
}

export class KPIValue {
  label: string;
  value: number;
}
