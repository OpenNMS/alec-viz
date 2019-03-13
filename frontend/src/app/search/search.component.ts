import {Component, OnInit, ViewChild} from '@angular/core';
import {SearchResult, SearchService} from '../search.service';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, flatMap} from 'rxjs/operators';
import {NgbTypeahead, NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs/internal/Subject';
import {merge} from 'rxjs/internal/observable/merge';
import {FocusState, StateService} from '../state.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  model: any;

  @ViewChild('instance') instance: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  constructor(private searchService: SearchService, private stateService: StateService) { }

  ngOnInit() {
  }

  onSelect(e: NgbTypeaheadSelectItemEvent) {
    const searchResult = <SearchResult>e.item;
    const focusState = new FocusState();
    focusState.focusOn = searchResult;
    console.log('selected', e);
    this.stateService.updateFocusState(focusState);
  }

  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      flatMap(term => {
        return this.searchService.search(term);
      })
    );
  }

  formatter = (x: SearchResult) => x.label;

}
