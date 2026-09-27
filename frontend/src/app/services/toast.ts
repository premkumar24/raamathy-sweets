import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  message = signal('');
  type = signal<ToastType>('success');

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  show(
    message: string,
    type: ToastType = 'success'
  ): void {

    this.message.set(message);
    this.type.set(type);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.clear();
    }, 3000);
  }

  clear(): void {

    this.message.set('');

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}