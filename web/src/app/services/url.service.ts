import { Injectable } from '@angular/core';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  constructor(
    private configuration:ConfigurationService
  ) { }

}
