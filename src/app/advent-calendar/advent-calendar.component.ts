import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Door {
  day: number;
  isOpen: boolean;
  content: {
    emoji: string;
    message: string;
    color: string;
  };
}

@Component({
  selector: 'app-advent-calendar',
  imports: [CommonModule],
  templateUrl: './advent-calendar.component.html',
  styleUrl: './advent-calendar.component.scss'
})
export class AdventCalendarComponent {
  // App version - update this with each deploy
  protected readonly appVersion = '1.0.0';

  private readonly currentDate = new Date();
  protected readonly currentDay = signal(this.currentDate.getDate());
  protected readonly currentMonth = signal(this.currentDate.getMonth() + 1);

  protected readonly doors = signal<Door[]>(this.initializeDoors());

  protected readonly openedDoorsCount = computed(() =>
    this.doors().filter(door => door.isOpen).length
  );

  private initializeDoors(): Door[] {
    const surprises = [
      { emoji: '🎅', message: 'Santa is coming to town!', color: '#e74c3c' },
      { emoji: '⭐', message: 'Shine bright like a star!', color: '#f39c12' },
      { emoji: '🎁', message: 'Every day is a gift!', color: '#3498db' },
      { emoji: '❄️', message: 'Let it snow!', color: '#95a5a6' },
      { emoji: '🔔', message: 'Jingle all the way!', color: '#e67e22' },
      { emoji: '🕯️', message: 'Light up the darkness!', color: '#f1c40f' },
      { emoji: '🎄', message: 'Oh Christmas tree!', color: '#27ae60' },
      { emoji: '🌟', message: 'Reach for the stars!', color: '#f39c12' },
      { emoji: '🎿', message: 'Winter sports time!', color: '#3498db' },
      { emoji: '☃️', message: 'Do you want to build a snowman?', color: '#ecf0f1' },
      { emoji: '🦌', message: 'Rudolph the red-nosed reindeer!', color: '#c0392b' },
      { emoji: '🧦', message: 'Stockings were hung with care!', color: '#e74c3c' },
      { emoji: '🍪', message: 'Cookies for Santa!', color: '#d35400' },
      { emoji: '🥛', message: 'Milk and cookies!', color: '#ecf0f1' },
      { emoji: '🎶', message: 'Carol of the bells!', color: '#9b59b6' },
      { emoji: '🌨️', message: 'Winter wonderland!', color: '#bdc3c7' },
      { emoji: '🎅', message: 'Ho ho ho!', color: '#e74c3c' },
      { emoji: '🎀', message: 'Wrapped with love!', color: '#e91e63' },
      { emoji: '🕊️', message: 'Peace on Earth!', color: '#ecf0f1' },
      { emoji: '💝', message: 'Love and joy!', color: '#e91e63' },
      { emoji: '🎊', message: 'Celebrate the season!', color: '#9b59b6' },
      { emoji: '✨', message: 'Magic is in the air!', color: '#f39c12' },
      { emoji: '🎉', message: "It's almost Christmas!", color: '#e74c3c' },
      { emoji: '🎄', message: 'Merry Christmas Eve!', color: '#27ae60' }
    ];

    return Array.from({ length: 24 }, (_, i) => ({
      day: i + 1,
      isOpen: false,
      content: surprises[i]
    }));
  }

  protected toggleDoor(day: number): void {
    // Only allow opening doors in December and if the day has arrived
    if (this.currentMonth() !== 12) {
      return;
    }

    if (day > this.currentDay()) {
      return;
    }

    this.doors.update(doors =>
      doors.map(door =>
        door.day === day
          ? { ...door, isOpen: !door.isOpen }
          : door
      )
    );
  }

  protected canOpenDoor(day: number): boolean {
    return this.currentMonth() === 12 && day <= this.currentDay();
  }

  protected getDoorClass(door: Door): string {
    const classes = ['door'];

    if (door.isOpen) {
      classes.push('door--open');
    }

    if (!this.canOpenDoor(door.day)) {
      classes.push('door--locked');
    }

    return classes.join(' ');
  }
}
