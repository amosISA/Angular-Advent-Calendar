import { Component, signal, computed, effect, PLATFORM_ID, inject, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Door {
  day: number;
  isOpen: boolean;
  content: {
    emoji: string;
    message: string;
    color: string;
    image?: string;
    link?: string;
    quote?: string;
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

type Theme = 'classic' | 'winter' | 'elegant' | 'playful';

@Component({
  selector: 'app-advent-calendar',
  imports: [CommonModule],
  templateUrl: './advent-calendar.component.html',
  styleUrl: './advent-calendar.component.scss'
})
export class AdventCalendarComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private readonly elementRef = inject(ElementRef);

  @ViewChild('confettiCanvas', { static: false }) confettiCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly currentDate = new Date();
  protected readonly currentDay = signal(this.currentDate.getDate());
  protected readonly currentMonth = signal(this.currentDate.getMonth() + 1);

  protected readonly doors = signal<Door[]>(this.initializeDoors());
  protected readonly theme = signal<Theme>('classic');
  protected readonly soundEnabled = signal(true);
  protected readonly achievements = signal<Achievement[]>(this.initializeAchievements());
  protected readonly showAchievements = signal(false);
  protected readonly confettiActive = signal(false);

  protected readonly openedDoorsCount = computed(() =>
    this.doors().filter(door => door.isOpen).length
  );

  protected readonly unlockedAchievementsCount = computed(() =>
    this.achievements().filter(a => a.unlocked).length
  );

  protected readonly newlyUnlockedAchievements = signal<Achievement[]>([]);

  constructor() {
    // Load saved state from localStorage (browser only)
    if (isPlatformBrowser(this.platformId)) {
      this.loadState();

      // Save state whenever doors change
      effect(() => {
        this.doors();
        this.saveState();
      });

      // Track achievements
      effect(() => {
        this.checkAchievements();
      });
    }
  }

  private initializeDoors(): Door[] {
    const surprises = [
      {
        emoji: '🎅',
        message: 'Santa is coming to town!',
        color: '#e74c3c',
        quote: '"The best way to spread Christmas cheer is singing loud for all to hear."'
      },
      {
        emoji: '⭐',
        message: 'Shine bright like a star!',
        color: '#f39c12',
        quote: '"Follow the star and believe in miracles."'
      },
      {
        emoji: '🎁',
        message: 'Every day is a gift!',
        color: '#3498db',
        quote: '"The greatest gift is the gift of giving."'
      },
      {
        emoji: '❄️',
        message: 'Let it snow!',
        color: '#95a5a6',
        quote: '"Snowflakes are winter\'s butterflies."'
      },
      {
        emoji: '🔔',
        message: 'Jingle all the way!',
        color: '#e67e22',
        quote: '"May your days be merry and bright!"'
      },
      {
        emoji: '🕯️',
        message: 'Light up the darkness!',
        color: '#f1c40f',
        quote: '"A single candle can light a thousand others."'
      },
      {
        emoji: '🎄',
        message: 'Oh Christmas tree!',
        color: '#27ae60',
        quote: '"The magic of Christmas never ends."'
      },
      {
        emoji: '🌟',
        message: 'Reach for the stars!',
        color: '#f39c12',
        quote: '"Dream big and sparkle brighter!"'
      },
      {
        emoji: '🎿',
        message: 'Winter sports time!',
        color: '#3498db',
        quote: '"Life is better on the slopes!"'
      },
      {
        emoji: '☃️',
        message: 'Do you want to build a snowman?',
        color: '#ecf0f1',
        quote: '"Some people are worth melting for."'
      },
      {
        emoji: '🦌',
        message: 'Rudolph the red-nosed reindeer!',
        color: '#c0392b',
        quote: '"May your nose always guide the way!"'
      },
      {
        emoji: '🧦',
        message: 'Stockings were hung with care!',
        color: '#e74c3c',
        quote: '"The stockings were hung by the chimney with care."'
      },
      {
        emoji: '🍪',
        message: 'Cookies for Santa!',
        color: '#d35400',
        quote: '"Cookies make everything better!"'
      },
      {
        emoji: '🥛',
        message: 'Milk and cookies!',
        color: '#ecf0f1',
        quote: '"The perfect midnight snack!"'
      },
      {
        emoji: '🎶',
        message: 'Carol of the bells!',
        color: '#9b59b6',
        quote: '"Music is the soundtrack of the holidays."'
      },
      {
        emoji: '🌨️',
        message: 'Winter wonderland!',
        color: '#bdc3c7',
        quote: '"Walking in a winter wonderland!"'
      },
      {
        emoji: '🎅',
        message: 'Ho ho ho!',
        color: '#e74c3c',
        quote: '"Believe in the magic of Christmas!"'
      },
      {
        emoji: '🎀',
        message: 'Wrapped with love!',
        color: '#e91e63',
        quote: '"Love is the greatest gift of all."'
      },
      {
        emoji: '🕊️',
        message: 'Peace on Earth!',
        color: '#ecf0f1',
        quote: '"Peace, love, and joy to all."'
      },
      {
        emoji: '💝',
        message: 'Love and joy!',
        color: '#e91e63',
        quote: '"The best things in life aren\'t things."'
      },
      {
        emoji: '🎊',
        message: 'Celebrate the season!',
        color: '#9b59b6',
        quote: '"Every moment is a celebration!"'
      },
      {
        emoji: '✨',
        message: 'Magic is in the air!',
        color: '#f39c12',
        quote: '"Believe in magic and it will find you."'
      },
      {
        emoji: '🎉',
        message: "It's almost Christmas!",
        color: '#e74c3c',
        quote: '"The countdown is almost over!"'
      },
      {
        emoji: '🎄',
        message: 'Merry Christmas Eve!',
        color: '#27ae60',
        quote: '"Twas the night before Christmas..."'
      }
    ];

    return Array.from({ length: 24 }, (_, i) => ({
      day: i + 1,
      isOpen: false,
      content: surprises[i]
    }));
  }

  private initializeAchievements(): Achievement[] {
    return [
      {
        id: 'first-door',
        title: 'First Steps',
        description: 'Open your first door',
        icon: '🎁',
        unlocked: false
      },
      {
        id: 'early-bird',
        title: 'Early Bird',
        description: 'Open a door on the first day of December',
        icon: '🐦',
        unlocked: false
      },
      {
        id: 'halfway',
        title: 'Halfway There',
        description: 'Open 12 doors',
        icon: '⭐',
        unlocked: false,
        progress: 0,
        total: 12
      },
      {
        id: 'almost-done',
        title: 'Almost Done',
        description: 'Open 20 doors',
        icon: '🎊',
        unlocked: false,
        progress: 0,
        total: 20
      },
      {
        id: 'completionist',
        title: 'Completionist',
        description: 'Open all 24 doors',
        icon: '🏆',
        unlocked: false,
        progress: 0,
        total: 24
      },
      {
        id: 'perfect-timing',
        title: 'Perfect Timing',
        description: 'Open a door on its exact day',
        icon: '⏰',
        unlocked: false
      },
      {
        id: 'theme-explorer',
        title: 'Theme Explorer',
        description: 'Try all 4 themes',
        icon: '🎨',
        unlocked: false,
        progress: 0,
        total: 4
      }
    ];
  }

  protected toggleDoor(day: number): void {
    // Only allow opening doors in December and if the day has arrived
    if (this.currentMonth() !== 12) {
      return;
    }

    if (day > this.currentDay()) {
      return;
    }

    const door = this.doors().find(d => d.day === day);
    if (!door) return;

    const wasOpen = door.isOpen;

    this.doors.update(doors =>
      doors.map(door =>
        door.day === day
          ? { ...door, isOpen: !door.isOpen }
          : door
      )
    );

    // Trigger confetti and sound when opening a door
    if (!wasOpen && door) {
      this.playOpenSound();
      this.triggerConfetti();

      // Check for perfect timing achievement
      if (day === this.currentDay()) {
        this.unlockAchievement('perfect-timing');
      }
    }
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

  // Keyboard navigation
  protected handleKeyDown(event: KeyboardEvent, day: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleDoor(day);
    }
  }

  // Theme switching
  protected changeTheme(newTheme: Theme): void {
    this.theme.set(newTheme);

    // Track theme changes for achievement
    if (isPlatformBrowser(this.platformId)) {
      const themes = JSON.parse(localStorage.getItem('advent-themes-tried') || '[]');
      if (!themes.includes(newTheme)) {
        themes.push(newTheme);
        localStorage.setItem('advent-themes-tried', JSON.stringify(themes));

        // Update achievement progress
        this.achievements.update(achievements =>
          achievements.map(a =>
            a.id === 'theme-explorer'
              ? { ...a, progress: themes.length, unlocked: themes.length >= 4 }
              : a
          )
        );
      }
    }
  }

  protected toggleSound(): void {
    this.soundEnabled.update(enabled => !enabled);
  }

  protected toggleAchievements(): void {
    this.showAchievements.update(show => !show);
  }

  // Social sharing
  protected shareProgress(): void {
    const count = this.openedDoorsCount();
    const text = `I've opened ${count} of 24 doors in this amazing Angular Advent Calendar! 🎄✨`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: 'Advent Calendar Progress',
        text: text,
        url: url
      }).catch(() => {
        // Fallback to clipboard
        this.copyToClipboard(text + ' ' + url);
      });
    } else {
      this.copyToClipboard(text + ' ' + url);
    }
  }

  private copyToClipboard(text: string): void {
    if (isPlatformBrowser(this.platformId)) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Progress copied to clipboard! 🎉');
      });
    }
  }

  // Confetti system
  private triggerConfetti(): void {
    this.confettiActive.set(true);

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.createConfetti();
      }, 100);

      setTimeout(() => {
        this.confettiActive.set(false);
      }, 4000);
    }
  }

  private createConfetti(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.confettiCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiPieces: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
    }> = [];

    const colors = ['#ff6b6b', '#4ecdc4', '#ffd700', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'];

    // Create confetti pieces
    for (let i = 0; i < 150; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 4,
        speedY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Animate confetti
    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confettiPieces.forEach((piece, index) => {
        piece.y += piece.speedY;
        piece.x += piece.speedX;
        piece.rotation += piece.rotationSpeed;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();

        // Remove confetti that's off screen
        if (piece.y > canvas.height) {
          confettiPieces.splice(index, 1);
        }
      });

      if (confettiPieces.length > 0) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Sound effects
  private playOpenSound(): void {
    if (!this.soundEnabled() || !isPlatformBrowser(this.platformId)) return;

    // Create a simple pleasant tone using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Add a second harmonic for richness
    const oscillator2 = audioContext.createOscillator();
    oscillator2.connect(gainNode);
    oscillator2.frequency.value = 659.25; // E5
    oscillator2.type = 'sine';
    oscillator2.start(audioContext.currentTime + 0.1);
    oscillator2.stop(audioContext.currentTime + 0.6);
  }

  // Achievement system
  private checkAchievements(): void {
    const openedCount = this.openedDoorsCount();
    const achievements = this.achievements();

    // First door achievement
    if (openedCount >= 1 && !achievements.find(a => a.id === 'first-door')?.unlocked) {
      this.unlockAchievement('first-door');
    }

    // Early bird (opened door on December 1st)
    if (this.currentDay() === 1 && openedCount >= 1 && !achievements.find(a => a.id === 'early-bird')?.unlocked) {
      this.unlockAchievement('early-bird');
    }

    // Halfway achievement
    if (openedCount >= 12 && !achievements.find(a => a.id === 'halfway')?.unlocked) {
      this.unlockAchievement('halfway');
    }

    // Almost done achievement
    if (openedCount >= 20 && !achievements.find(a => a.id === 'almost-done')?.unlocked) {
      this.unlockAchievement('almost-done');
    }

    // Completionist achievement
    if (openedCount >= 24 && !achievements.find(a => a.id === 'completionist')?.unlocked) {
      this.unlockAchievement('completionist');
    }

    // Update progress for progressive achievements
    this.achievements.update(achievements =>
      achievements.map(a => {
        if (a.id === 'halfway' || a.id === 'almost-done' || a.id === 'completionist') {
          return { ...a, progress: openedCount };
        }
        return a;
      })
    );
  }

  private unlockAchievement(id: string): void {
    const achievement = this.achievements().find(a => a.id === id);
    if (!achievement || achievement.unlocked) return;

    this.achievements.update(achievements =>
      achievements.map(a =>
        a.id === id ? { ...a, unlocked: true } : a
      )
    );

    // Show achievement notification
    this.newlyUnlockedAchievements.update(achievements => [...achievements, { ...achievement, unlocked: true }]);

    // Remove notification after 5 seconds
    setTimeout(() => {
      this.newlyUnlockedAchievements.update(achievements =>
        achievements.filter(a => a.id !== id)
      );
    }, 5000);

    // Play achievement sound
    if (this.soundEnabled() && isPlatformBrowser(this.platformId)) {
      this.playAchievementSound();
    }
  }

  private playAchievementSound(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = audioContext.currentTime + index * 0.15;
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  // LocalStorage persistence
  private saveState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.setItem('advent-calendar-doors', JSON.stringify(this.doors()));
      localStorage.setItem('advent-calendar-achievements', JSON.stringify(this.achievements()));
      localStorage.setItem('advent-calendar-theme', this.theme());
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  private loadState(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const savedDoors = localStorage.getItem('advent-calendar-doors');
      if (savedDoors) {
        this.doors.set(JSON.parse(savedDoors));
      }

      const savedAchievements = localStorage.getItem('advent-calendar-achievements');
      if (savedAchievements) {
        this.achievements.set(JSON.parse(savedAchievements));
      }

      const savedTheme = localStorage.getItem('advent-calendar-theme');
      if (savedTheme) {
        this.theme.set(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }
}
