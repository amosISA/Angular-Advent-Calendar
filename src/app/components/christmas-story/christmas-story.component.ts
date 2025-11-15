import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Christmas Story Component
 * Displays an interactive Christmas story with beautiful animations
 */
@Component({
  selector: 'app-christmas-story',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="christmas-story">
      <div class="story-header">
        <h1>The Magic of Christmas Eve</h1>
        <p class="subtitle">A heartwarming tale of wonder and joy</p>
      </div>

      <div class="story-content">
        <div class="story-section">
          <div class="chapter-number">Chapter 1</div>
          <h2>The Silent Snowfall</h2>
          <p>
            In a small village nestled among snow-covered pines, Christmas Eve arrived with a gentle
            whisper of snowflakes dancing through the crisp winter air. The town square glowed with
            warm golden lights, and the scent of cinnamon and pine filled every corner.
          </p>
          <p>
            Little Emma pressed her nose against the frosted window, watching the snowflakes perform
            their magical ballet. Each flake was unique, just like her grandmother had told her—tiny
            works of art crafted by winter's gentle hand.
          </p>
        </div>

        <div class="story-section">
          <div class="chapter-number">Chapter 2</div>
          <h2>The Mysterious Gift</h2>
          <p>
            As the church bells chimed midnight, Emma discovered a beautiful ornament on the
            Christmas tree—one she had never seen before. It shimmered with an otherworldly light,
            depicting a starlit winter scene that seemed to move and breathe with life.
          </p>
          <p>
            Her grandmother smiled knowingly. "That ornament," she said softly, "has been in our
            family for generations. It only appears on Christmas Eve to those who truly believe in
            the magic of the season."
          </p>
        </div>

        <div class="story-section">
          <div class="chapter-number">Chapter 3</div>
          <h2>The Gift of Wonder</h2>
          <p>
            As Emma gazed into the ornament, she realized that the true magic of Christmas wasn't
            in the presents under the tree or the decorations on the walls. It was in the warmth of
            family gathered together, the joy of giving, and the wonder that fills our hearts when
            we choose to believe.
          </p>
          <p>
            That night, as snow continued to fall outside, Emma fell asleep with a smile, knowing
            that Christmas magic is real—it lives in every act of kindness, every shared laugh, and
            every moment of love we give to one another.
          </p>
        </div>

        <div class="story-footer">
          <div class="snowflake">❄️</div>
          <p class="moral">The greatest gifts cannot be wrapped—they are the moments we share and the love we give.</p>
          <div class="snowflake">❄️</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .christmas-story {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      animation: fadeIn 0.6s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .story-header {
      text-align: center;
      margin-bottom: 60px;
      animation: slideDown 0.8s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .story-header h1 {
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      margin-bottom: 16px;
      font-family: 'Georgia', serif;
      letter-spacing: -1px;
    }

    .subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.8);
      font-style: italic;
      margin: 0;
    }

    .story-content {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 48px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .story-section {
      margin-bottom: 48px;
      animation: fadeInUp 0.8s ease;
      animation-fill-mode: both;
    }

    .story-section:nth-child(1) { animation-delay: 0.2s; }
    .story-section:nth-child(2) { animation-delay: 0.4s; }
    .story-section:nth-child(3) { animation-delay: 0.6s; }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chapter-number {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .story-section h2 {
      font-size: 2rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 20px 0;
      font-family: 'Georgia', serif;
    }

    .story-section p {
      font-size: 1.125rem;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 16px 0;
      text-align: justify;
      font-family: 'Georgia', serif;
    }

    .story-footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 40px;
      border-top: 2px solid rgba(255, 255, 255, 0.1);
      animation: fadeIn 1s ease 0.8s;
      animation-fill-mode: both;
    }

    .snowflake {
      font-size: 2rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .moral {
      font-size: 1.25rem;
      font-style: italic;
      color: #ffd700;
      margin: 20px 0;
      font-weight: 500;
      font-family: 'Georgia', serif;
    }

    @media (max-width: 768px) {
      .christmas-story {
        padding: 20px 16px;
      }

      .story-header h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .story-content {
        padding: 32px 24px;
      }

      .story-section h2 {
        font-size: 1.5rem;
      }

      .story-section p {
        font-size: 1rem;
        text-align: left;
      }
    }
  `]
})
export class ChristmasStoryComponent {}
