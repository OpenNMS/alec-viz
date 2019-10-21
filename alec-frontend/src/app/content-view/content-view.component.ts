import { Component, OnInit, HostBinding, HostListener  } from '@angular/core';
import { Subject, Subscription, timer, pipe, } from 'rxjs';
import { takeWhile, filter } from 'rxjs/operators';
import {Observable} from 'rxjs/Rx';
import { getStyle, hexToRgba } from '@coreui/coreui/dist/js/coreui-utilities';
import { CustomTooltips } from '@coreui/coreui-plugin-chartjs-custom-tooltips';
import {coerceNumberProperty} from '@angular/cdk/coercion';
import { trigger, transition, state, animate, style, AnimationEvent } from '@angular/animations';

import {StateService} from '../services/state.service';
import {Edge, Model, ModelService, Vertex, ModelMetadata} from '../services/model.service';

@Component({
  selector: 'app-content-view',
  templateUrl: './content-view.component.html',
  styleUrls: ['./content-view.component.scss'],
  animations: [
    trigger('openClose', [
      state('open', style({
        opacity: 1,
        textAlign: 'center',
        bottom: 0,
        position: 'fixed',
        width: '100%',
        left: '1%',
        height: 'auto',
        paddingBottom: '20px',
      })),
      state('closed', style({
        height : '0px',
        opacity: 0
      })),

      state('enlarged', style({
        height: '85%',
        width: '93%',
        left: '5%',
        top: '70px'
      })),

      state('ensized', style({
        height: '75%',
        width: '90%',
      })),
      // transition(':enter', [
      //   style({transform: 'translateY(-100%)'}),
      //   animate('200ms ease-in', style({transform: 'translateY(0%)'}))
      // ]),
      // transition(':leave', [
      //   animate('200ms ease-in', style({transform: 'translateY(-100%)'}))
      // ]),
      transition('open => closed', [
        animate('1s', style({opacity: '0'}))
        // animate('200ms ease-in', style({transform: 'translateY(0%)'}))
      ]),
      transition('closed => open', [
        // animate('2s', style({opacity: '0'}))
        animate('1s ease-in', style({opacity: '0'}))
      ]),
      transition('* => closed', [
        animate('200ms')
        // style({transform: 'translateY(-100%)'}),
        // animate('200ms ease-in', style({transform: 'translateY(0%)'}))
      ]),
      transition('* => open', [
        animate('0.5s')
        // animate('200ms ease-in', style({transform: 'translateY(-100%)'}))
      ]),
      transition('open <=> closed', [
        animate('2s')
      ]),
      transition ('* => open', [
        animate ('2s',
          style ({ opacity: '*' }),
        ),
      ]),
      transition('* => *', [
        animate('2s')
      ]),

      // FOR GRAPH CONTAINER:

      transition('ensized => enlarged', [
        // animate('7s')
        // style({transform: 'translateY(-100%)'}),
        animate('200s ease-in')
      ]),
      transition('enlarged => ensized', [
        animate('200s ease-in')
        // animate('200ms ease-in', style({transform: 'translateY(-100%)'}))
      ]),
      transition('* => enlarged', [
        animate('2s ease-in')
        // style({transform: 'translateY(-100%)'}),
        // animate('200ms ease-in', style({transform: 'translateY(0%)'}))
      ]),
      transition('* => ensized', [
        animate('2s ease-in')
        // animate('200ms ease-in', style({transform: 'translateY(-100%)'}))
      ]),
      transition('ensized <=> enlarged', [
        animate('2s ease-in')
      ]),
      transition ('* => ensized', [
        animate ('2s ease-in',
          style ({ opacity: '*' }),
        ),
      ]),
      transition('* => *', [
        animate('2s ease-in')
      ]),
    ]),
  ],
})
export class ContentViewComponent implements OnInit {
  /* Detect Inactivity  */
  userActivity;
  userInactive: Subject<any> = new Subject();

  setTimeout() {
    this.userActivity = setTimeout(() => {
      this.userInactive.next(undefined);
    }, 3000);
  }

  @HostListener('window:click', ['$event'])
  @HostListener('window:focus', ['$event'])
  @HostListener('window:blur') refreshInactivity() {
    console.log('Refreshed')
    // this.userInactive.next(undefined);
    clearTimeout(this.userActivity);
    this.isOpen = true;
  }

  @HostListener('window:mousemove') refreshUserState() {
    clearTimeout(this.userActivity);
    this.isOpen = true;
    this.setTimeout();
  }
  /* Detect Inactivity - End */


  /* Slider Animation */
  isOpen = true;

  toggle() {
    this.isOpen = !this.isOpen;
  }

  onAnimationEvent ( event: AnimationEvent ) {
  }
  /* Slider Animation- END */


  /* Slider */
  autoTicks = false;
  disabled = false;
  invert = false;
  max;
  min;
  meanTime = (this.max + this.min)/2;
  currentTime;
  showTicks = true;
  step = 1;
  thumbLabel = false;
  value = 0;
  vertical = false;

  get tickInterval(): number | 'auto' {
    return this._tickInterval;
  }
  set tickInterval(value) {
    this._tickInterval = coerceNumberProperty(value);
  }
  private _tickInterval = 3;

  displayWith(value, localFormat){
    if(localFormat){
      return `${new Date(value).toDateString()} ${new Date(value).toLocaleTimeString()} `
    }
    return `${new Date(value).toLocaleDateString()} ${new Date(value).toLocaleTimeString()} `;
  }
  /* Slider - End */


/* DETAIL COMPONENT */
  /* timeslider component */
  modelMetadata: ModelMetadata;
  /* timeslider component - end */

  model: Model;
  activeElement: Vertex | Edge;
  pointInTimeMs: number;
  minTimeMs : number;
  maxTimeMs: number;
  timeSet = false;
  timeLapsePlaying = false;

  constructor(private modelService: ModelService, private stateService: StateService) {
    this.modelService.getModel().subscribe((model: Model) => {
      this.onModelUpdated(model);
      if(!this.timeSet){
        this.min = this.modelService.getMinTime();
        this.max = this.modelService.getMaxTime();
        this.meanTime = (this.max + this.min)/2;
        console.log('this.min: ', this.min)
        console.log('this.max: ', this.max)
        console.log('this.meanTime: ', this.meanTime)
        this.updateMeanTime();
        this.pointInTimeMs = this.meanTime;
        this.timeSet = true;
      }
      this.stateService.resetView$.subscribe(() => {
        this.timeLapsePlaying = false;
        this.updateMeanTime(); //optional
        this.pointInTimeMs = this.meanTime;
      })
    });

    stateService.activeElement$.subscribe(activeElement => {
      this.activeElement = activeElement;
    });

    this.pointInTimeMs = new Date().getTime();
    stateService.pointInTime$.subscribe(pointInTimeMs => {
      this.pointInTimeMs = pointInTimeMs;
      console.log('Point in TIme: ', this.pointInTimeMs )
    });

    /* Detect Inactivity */
    this.setTimeout();
    this.userInactive.subscribe(() => {
      console.log('user has been inactive for 3s');
      this.isOpen = false;
    });
    console.log('currentTIme/pointInTimeMs : ', this.pointInTimeMs)
    /* Detect Inactivity - ENd */
  }

  private onModelUpdated(model: Model) {
    this.model = model;
    console.log('Updated Model JSON: ', this.model)
  }

  setTime(timestamp: number|string) {
    if (typeof timestamp === 'string') {
      this.stateService.setPointInTimeMs(Number(timestamp));
    } else {
      this.stateService.setPointInTimeMs(<number>timestamp);
    }
  }

  onTimeChanged() {
    this.stateService.setPointInTimeMs(this.pointInTimeMs);
  }

  /* timeslider component */
  private onModelMetadataChanged(modelMetadata: ModelMetadata) {
    this.modelMetadata = modelMetadata;
    // this.minTimeMs = modelMetadata.timeMetadata.startMs;
    // this.maxTimeMs = modelMetadata.timeMetadata.endMs;
  }

  ngOnInit(): void {
    this.modelService.modelMetadata$.subscribe(modelMetadata => {
      this.onModelMetadataChanged(modelMetadata);
    });
    this.stateService.pointInTime$.subscribe(pointInTimeMs => {
      this.pointInTimeMs = pointInTimeMs;
    });
  }
  /* timeslider component - End */

  // addToFocus(el: Vertex | Edge) {
  //   this.stateService.addToFocus(el);
  // }

  // ngOnInit() {
  //   // TODO: Unsub
  // }

/* DETAIL COMPONENT - END */

/* Detail Component Extended Functions */
subscription: Subscription;
ts;

updateMeanTime(){
  this.meanTime = (this.max + this.min)/2;
}

forward(){
  this.pointInTimeMs = Math.min(this.pointInTimeMs + 60 * 1000, this.max);
  this.onTimeChanged();
}

playTimeLapse(){
  this.pointInTimeMs = this.min;
  this.timeLapsePlaying = !this.timeLapsePlaying
  if(this.timeLapsePlaying){
    this.ts = Observable.interval(1000).take(60).subscribe(()=> {
      this.forward();
      if(this.pointInTimeMs >= this.max){
        this.ts.unsubscribe();
        this.timeLapsePlaying = false;
      }
    })
  }
  else{
    this.ts.unsubscribe();
  }
}

onSliderChange(event){
  console.log('Slider Change event: ', event);
  this.onTimeChanged();
}

/* Detail Component Extended Functions - End */







  // time: NgbTimeStruct = {hour: 13, minute: 30, second: 0};

  // constructor(config: NgbTimepickerConfig) { 
  //    // customize default values of ratings used by this component tree
  //    config.seconds = false;
  //    config.spinners = false;
  // }

  radioModel: string = 'Month';

  // lineChart1
  public lineChart1Data: Array<any> = [
    {
      data: [65, 59, 84, 84, 51, 55, 40],
      label: 'Series A'
    }
  ];
  public lineChart1Labels: Array<any> = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public lineChart1Options: any = {
    tooltips: {
      enabled: false,
      custom: CustomTooltips
    },
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        gridLines: {
          color: 'transparent',
          zeroLineColor: 'transparent'
        },
        ticks: {
          fontSize: 2,
          fontColor: 'transparent',
        }

      }],
      yAxes: [{
        display: false,
        ticks: {
          display: false,
          min: 40 - 5,
          max: 84 + 5,
        }
      }],
    },
    elements: {
      line: {
        borderWidth: 1
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 4,
      },
    },
    legend: {
      display: false
    }
  };
  public lineChart1Colours: Array<any> = [
    {
      backgroundColor: getStyle('--primary'),
      borderColor: 'rgba(255,255,255,.55)'
    }
  ];
  public lineChart1Legend = false;
  public lineChart1Type = 'line';

  // lineChart2
  public lineChart2Data: Array<any> = [
    {
      data: [1, 18, 9, 17, 34, 22, 11],
      label: 'Series A'
    }
  ];
  public lineChart2Labels: Array<any> = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public lineChart2Options: any = {
    tooltips: {
      enabled: false,
      custom: CustomTooltips
    },
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        gridLines: {
          color: 'transparent',
          zeroLineColor: 'transparent'
        },
        ticks: {
          fontSize: 2,
          fontColor: 'transparent',
        }

      }],
      yAxes: [{
        display: false,
        ticks: {
          display: false,
          min: 1 - 5,
          max: 34 + 5,
        }
      }],
    },
    elements: {
      line: {
        tension: 0.00001,
        borderWidth: 1
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 4,
      },
    },
    legend: {
      display: false
    }
  };
  public lineChart2Colours: Array<any> = [
    { // grey
      backgroundColor: getStyle('--info'),
      borderColor: 'rgba(255,255,255,.55)'
    }
  ];
  public lineChart2Legend = false;
  public lineChart2Type = 'line';


  // lineChart3
  public lineChart3Data: Array<any> = [
    {
      data: [78, 81, 80, 45, 34, 12, 40],
      label: 'Series A'
    }
  ];
  public lineChart3Labels: Array<any> = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public lineChart3Options: any = {
    tooltips: {
      enabled: false,
      custom: CustomTooltips
    },
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        display: false
      }],
      yAxes: [{
        display: false
      }]
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
      },
    },
    legend: {
      display: false
    }
  };
  public lineChart3Colours: Array<any> = [
    {
      backgroundColor: 'rgba(255,255,255,.2)',
      borderColor: 'rgba(255,255,255,.55)',
    }
  ];
  public lineChart3Legend = false;
  public lineChart3Type = 'line';


  // barChart1
  public barChart1Data: Array<any> = [
    {
      data: [78, 81, 80, 45, 34, 12, 40, 78, 81, 80, 45, 34, 12, 40, 12, 40],
      label: 'Series A'
    }
  ];
  public barChart1Labels: Array<any> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
  public barChart1Options: any = {
    tooltips: {
      enabled: false,
      custom: CustomTooltips
    },
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        display: false,
        barPercentage: 0.6,
      }],
      yAxes: [{
        display: false
      }]
    },
    legend: {
      display: false
    }
  };
  public barChart1Colours: Array<any> = [
    {
      backgroundColor: 'rgba(255,255,255,.3)',
      borderWidth: 0
    }
  ];
  public barChart1Legend = false;
  public barChart1Type = 'bar';

  // mainChart

  public mainChartElements = 27;
  public mainChartData1: Array<number> = [];
  public mainChartData2: Array<number> = [];
  public mainChartData3: Array<number> = [];

  public mainChartData: Array<any> = [
    {
      data: this.mainChartData1,
      label: 'Current'
    },
    {
      data: this.mainChartData2,
      label: 'Previous'
    },
    {
      data: this.mainChartData3,
      label: 'BEP'
    }
  ];
  /* tslint:disable:max-line-length */
  public mainChartLabels: Array<any> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Thursday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  /* tslint:enable:max-line-length */
  public mainChartOptions: any = {
    tooltips: {
      enabled: false,
      custom: CustomTooltips,
      intersect: true,
      mode: 'index',
      position: 'nearest',
      callbacks: {
        labelColor: function(tooltipItem, chart) {
          return { backgroundColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor };
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        gridLines: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.charAt(0);
          }
        }
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true,
          maxTicksLimit: 5,
          stepSize: Math.ceil(250 / 5),
          max: 250
        }
      }]
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
        hoverBorderWidth: 3,
      }
    },
    legend: {
      display: false
    }
  };
  public mainChartColours: Array<any> = [
    { // brandInfo
      backgroundColor: hexToRgba(getStyle('--info'), 10),
      borderColor: getStyle('--info'),
      pointHoverBackgroundColor: '#fff'
    },
    { // brandSuccess
      backgroundColor: 'transparent',
      borderColor: getStyle('--success'),
      pointHoverBackgroundColor: '#fff'
    },
    { // brandDanger
      backgroundColor: 'transparent',
      borderColor: getStyle('--danger'),
      pointHoverBackgroundColor: '#fff',
      borderWidth: 1,
      borderDash: [8, 5]
    }
  ];
  public mainChartLegend = false;
  public mainChartType = 'line';

  // social box charts

  public brandBoxChartData1: Array<any> = [
    {
      data: [65, 59, 84, 84, 51, 55, 40],
      label: 'Facebook'
    }
  ];
  public brandBoxChartData2: Array<any> = [
    {
      data: [1, 13, 9, 17, 34, 41, 38],
      label: 'Twitter'
    }
  ];
  public brandBoxChartData3: Array<any> = [
    {
      data: [78, 81, 80, 45, 34, 12, 40],
      label: 'LinkedIn'
    }
  ];
  public brandBoxChartData4: Array<any> = [
    {
      data: [35, 23, 56, 22, 97, 23, 64],
      label: 'Google+'
    }
  ];

  public brandBoxChartLabels: Array<any> = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public brandBoxChartOptions: any = {
    tooltips: {
      enabled: false,
      custom: CustomTooltips
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        display: false,
      }],
      yAxes: [{
        display: false,
      }]
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
        hoverBorderWidth: 3,
      }
    },
    legend: {
      display: false
    }
  };
  public brandBoxChartColours: Array<any> = [
    {
      backgroundColor: 'rgba(255,255,255,.1)',
      borderColor: 'rgba(255,255,255,.55)',
      pointHoverBackgroundColor: '#fff'
    }
  ];
  public brandBoxChartLegend = false;
  public brandBoxChartType = 'line';

  public random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // ngOnInit(): void {
  //   this.modelService.modelMetadata$.subscribe(modelMetadata => {
  //     this.onModelMetadataChanged(modelMetadata);
  //   });
  //   this.stateService.pointInTime$.subscribe(pointInTimeMs => {
  //     this.pointInTimeMs = pointInTimeMs;
  //   });
    // // generate random values for mainChart
    // for (let i = 0; i <= this.mainChartElements; i++) {
    //   this.mainChartData1.push(this.random(50, 200));
    //   this.mainChartData2.push(this.random(80, 100));
    //   this.mainChartData3.push(65);
    // }
  // }
}

