import {Injectable, OnInit} from '@angular/core';
import {Observable, of} from 'rxjs';
import {Model, ModelService, Vertex} from './model.service';
import * as _ from 'lodash';

enum SearchResultType {
  Vertex = 1
}

export class SearchResult {
  label: string;
  type: SearchResultType;
  id: any;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  model: Model;

  constructor(private modelService: ModelService) {
    this.modelService.getModel().subscribe((model: Model) => {
      this.model = model;
    });
  }

  search(term: string): Observable<SearchResult[]> {
    if (this.model === undefined) {
      // No model, no results
      return of([]);
    }

    const lowerCaseTerm = term.toLowerCase();
    let matchedVertices = _.filter(this.model.vertices, (v: Vertex) => {
      if (_.isEmpty(v.label)) {
        return false;
      }
      if (term === '') {
        return true;
      }
      return v.label.toLowerCase().indexOf(lowerCaseTerm) > -1;
    });

    // Limit the results
    matchedVertices = matchedVertices.slice(0, 10);

    // Build search results from the vertices
    const searchResults = _.map(matchedVertices, (v: Vertex) => {
      const result = new SearchResult();
      result.label = v.label;
      result.type = SearchResultType.Vertex;
      result.id = v.id;
      return result;
    });
    console.log('results for term: ' + term, searchResults);
    return of(searchResults);
  }
}
