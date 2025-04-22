import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  menuItems = [
    // { 
    //   title: 'Dashboard', 
    //   route: '/dashboard', 
    //   icon: '📊',
    //   description: 'View your account overview and statistics'
    // },
    { 
      title: 'Profile', 
      route: '/profile', 
      icon: '👤',
      description: 'Manage your personal information'
    },
    { 
      title: 'Transactions', 
      route: '/transactions', 
      icon: '💳',
      description: 'View your transaction history'
    },
    // { 
    //   title: 'Settings', 
    //   route: '/settings', 
    //   icon: '⚙️',
    //   description: 'Configure your account settings'
    // },
    { 
      title: 'Airtime', 
      route: '/airtime', 
      icon: '📞',
      description: 'Purchase Airtime'
    },
    { 
      title: 'Data', 
      route: '/data', 
      icon: '📲',
      description: 'Purchase data'
    },
    { 
      title: 'Electricity', 
      route: '/electricity', 
      icon: '⚡️',
      description: 'Purchase Electricity'
    },
  ];
}