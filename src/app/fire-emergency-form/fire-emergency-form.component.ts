import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FireEmergencyService } from '../services/fire-emergency.service';

@Component({
  standalone: true,
  selector: 'app-fire-emergency-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './fire-emergency-form.component.html',
  styleUrls: ['./fire-emergency-form.component.scss']
})
export class FireEmergencyFormComponent {
  form = {
    fireSource: '',
    location: '',
    trappedOrInjured: '',
    fireSize: '',
    safeToStay: '',
    coordinates: '',
    firstName: '',
    lastName: '',
    medicalAidNumber: '',
    address: '',
    contactNumber: '',
    contractNumber: ''
  };

  loading = false;
  submitted = false;
  emergencyNumber = '0860070700';

  constructor(
    private fireService: FireEmergencyService,
    private route: ActivatedRoute
  ) {
    this.extractProfileFromRawQuery();
  }

  private extractProfileFromRawQuery(): void {
    const rawQuery = this.route.snapshot.queryParamMap.get('raw');
    if (rawQuery) {
      const params = new URLSearchParams(rawQuery);
      this.form.firstName = params.get('first') || '';
      this.form.lastName = params.get('last') || '';
      this.form.medicalAidNumber = params.get('medicalAidNo') || 'WRONG';
      this.form.address = params.get('address') || '';
      this.form.contactNumber = params.get('phone') || '';
      this.form.contractNumber = params.get('contractNo') || '';
    }
    
  }

  selectOption(question: keyof typeof this.form, value: string) {
    this.form[question] = value;
  }

  isSelected(question: keyof typeof this.form, value: string): boolean {
    return this.form[question] === value;
  }

  setLocationToHome() {
    if (this.form.address) {
      this.form.location = this.form.address;
    } else {
      alert('Home address not available in your profile.');
    }
  }
  

  submitForm() {
    this.loading = true;
    this.fireService.submitEmergencyForm(this.form).subscribe({
      next: () => {
        console.log('this.form :>> ', this.form);
        this.submitted = true;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Submission failed', err);
        alert('There was a problem submitting your emergency');
        this.submitted = true;
      }
    });
  }

  getCoordinates() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        this.form.coordinates = `${lat}, ${lon}`;
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
      }
    );
  }
}
