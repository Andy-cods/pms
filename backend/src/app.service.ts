import { Injectable } from '@nestjs/common';
import { APP_NAME } from './shared/constants/index.js';

@Injectable()
export class AppService {
  getHello(): string {
    return `${APP_NAME} API is running`;
  }
}
