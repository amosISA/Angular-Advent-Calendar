import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdventCalendarComponent } from './advent-calendar/advent-calendar.component';
import { AIAssistantComponent } from './components/ai-assistant/ai-assistant.component';
import { TabNavigationComponent } from './components/tab-navigation/tab-navigation.component';
import { ChristmasStoryComponent } from './components/christmas-story/christmas-story.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AdventCalendarComponent,
    AIAssistantComponent,
    TabNavigationComponent,
    ChristmasStoryComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
