import { Component, HostListener, OnInit } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

type InstallPlatform = 'android' | 'ios' | 'desktop' | null;

@Component({
  selector: 'app-install-pwa',
  templateUrl: './install-pwa.component.html',
  styleUrls: ['./install-pwa.component.scss'],
})
export class InstallPwaComponent implements OnInit {
  isVisible = false;
  isInstalling = false;
  platform: InstallPlatform = null;

  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private readonly dismissedAtKey = 'openfinance.pwa.dismissedAt';
  private readonly installedKey = 'openfinance.pwa.installed';
  private readonly shownSessionKey = 'openfinance.pwa.shownThisSession';
  private readonly dismissalPeriodMs = 7 * 24 * 60 * 60 * 1000;

  ngOnInit(): void {
    if (this.isStandalone()) {
      this.setStorageValue(this.installedKey, 'true');
      return;
    }

    if (this.getStorageValue(this.installedKey) === 'true') {
      return;
    }

    this.platform = this.detectInstallPlatform();

    if (this.platform === 'ios') {
      this.showInviteIfEligible();
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event): void {
    const installEvent = event as BeforeInstallPromptEvent;
    installEvent.preventDefault();

    const platform = this.detectInstallPlatform();

    if ((platform !== 'android' && platform !== 'desktop') || this.isStandalone()) {
      return;
    }

    this.deferredPrompt = installEvent;
    this.platform = platform;
    this.showInviteIfEligible();
  }

  @HostListener('window:appinstalled')
  onAppInstalled(): void {
    this.setStorageValue(this.installedKey, 'true');
    this.isVisible = false;
    this.deferredPrompt = null;
  }

  async installApp(): Promise<void> {
    if (
      (this.platform !== 'android' && this.platform !== 'desktop') ||
      !this.deferredPrompt ||
      this.isInstalling
    ) {
      return;
    }

    const installEvent = this.deferredPrompt;
    this.deferredPrompt = null;
    this.isInstalling = true;

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === 'accepted') {
        this.setStorageValue(this.installedKey, 'true');
        this.isVisible = false;
        return;
      }

      this.dismissInvite();
    } catch (error) {
      console.error('Não foi possível abrir o convite nativo de instalação:', error);
      this.isVisible = false;
    } finally {
      this.isInstalling = false;
    }
  }

  dismissInvite(): void {
    this.setStorageValue(this.dismissedAtKey, Date.now().toString());
    this.isVisible = false;
  }

  private showInviteIfEligible(): void {
    if (
      !this.platform ||
      this.isStandalone() ||
      this.getStorageValue(this.installedKey) === 'true' ||
      this.getStorageValue(this.shownSessionKey) === 'true' ||
      this.wasRecentlyDismissed()
    ) {
      return;
    }

    this.setStorageValue(this.shownSessionKey, 'true', true);
    this.isVisible = true;
  }

  private wasRecentlyDismissed(): boolean {
    const dismissedAt = Number(this.getStorageValue(this.dismissedAtKey));

    return Number.isFinite(dismissedAt) &&
      dismissedAt > 0 &&
      Date.now() - dismissedAt < this.dismissalPeriodMs;
  }

  private detectInstallPlatform(): InstallPlatform {
    if (typeof navigator === 'undefined') {
      return null;
    }

    const userAgent = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIos) {
      return 'ios';
    }

    if (/Android/i.test(userAgent)) {
      return 'android';
    }

    return 'desktop';
  }

  private isStandalone(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    const iosNavigator = navigator as Navigator & { standalone?: boolean };

    return window.matchMedia('(display-mode: standalone)').matches ||
      iosNavigator.standalone === true;
  }

  private getStorageValue(key: string, session = false): string | null {
    try {
      const storage = session ? sessionStorage : localStorage;
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  private setStorageValue(key: string, value: string, session = false): void {
    try {
      const storage = session ? sessionStorage : localStorage;
      storage.setItem(key, value);
    } catch {
      // A instalação ainda pode funcionar quando o navegador bloqueia o armazenamento local.
    }
  }
}
