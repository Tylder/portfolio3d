import {Component, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {projects as _projects} from '../../data/projects';
import {Project} from '../../models/project';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  animations: [
    trigger('showProjects', [
      // ...
      state('show', style({
        height: '200px',
        opacity: 1,
      })),
      state('hide', style({
        height: '100px',
        opacity: 0.8,
      })),
      transition('* => show', [
        animate('0.5s')
      ]),
      transition('* => hide', [
        animate('1s')
      ]),
    ]),
  ],
})
export class ProjectsComponent implements OnInit {

  projects: Project[] = _projects; // so that we can reach it in the template

  constructor() {
  }

  ngOnInit(): void {
  }

}
