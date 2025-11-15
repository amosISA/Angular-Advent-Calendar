import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdventCalendarComponent } from './advent-calendar/advent-calendar.component';
import { AIAssistantComponent } from './components/ai-assistant/ai-assistant.component';
import { TabNavigationComponent } from './components/tab-navigation/tab-navigation.component';
import { DynamicComponentContainerComponent } from './components/dynamic-component-container/dynamic-component-container.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AdventCalendarComponent,
    AIAssistantComponent,
    TabNavigationComponent,
    DynamicComponentContainerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit {
  @ViewChild('tabNav', { static: false }) tabNav?: TabNavigationComponent;
  @ViewChild('dynamicContainer', { static: false }) dynamicContainer?: DynamicComponentContainerComponent;

  ngAfterViewInit() {
    // Make tab navigation and dynamic container available globally for AI
    if (typeof window !== 'undefined') {
      (window as any).__appTabNav = this.tabNav;
      (window as any).__appDynamicContainer = this.dynamicContainer;
    }
  }
}
