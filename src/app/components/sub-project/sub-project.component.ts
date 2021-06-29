import {AfterContentInit, Component, Input} from '@angular/core';
import {Project} from '../../models/project';

@Component({
  selector: 'app-sub-project',
  templateUrl: './sub-project.component.html',
  styleUrls: ['./sub-project.component.scss']
})
export class SubProjectComponent implements AfterContentInit {

  @Input() project: Project;

  constructor() { }

  ngAfterContentInit(): void {
    console.log(this.project);
  }

}
