import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdventCalendarComponent } from './advent-calendar/advent-calendar.component';
import { AIAssistantComponent } from './components/ai-assistant/ai-assistant.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AdventCalendarComponent,
    AIAssistantComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}
