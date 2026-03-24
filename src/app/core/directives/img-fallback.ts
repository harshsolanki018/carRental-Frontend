import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appImgFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  @Input('appImgFallback') fallbackSrc = '';

  @HostListener('error', ['$event'])
  onError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img || !this.fallbackSrc) {
      return;
    }
    if (img.src === this.fallbackSrc) {
      return;
    }
    img.src = this.fallbackSrc;
  }
}
