import * as core from '@actions/core';

export class Logger {
  public log(type: 'info' | 'debug' | 'warning', message: string): void {
    switch (type) {
      case 'debug':
        core.debug(message);
        break;
      case 'warning':
        core.warning(message);
        break;
      default:
        core.info(message);
    }
  }
}
