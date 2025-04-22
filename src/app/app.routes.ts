import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AirtimeComponent } from './components/airtime/airtime.component';
import { DataComponent } from './components/data/data.component';
import { ElectricityComponent } from './components/electricity/electricity.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'airtime', component: AirtimeComponent },
  { path: 'data', component: DataComponent },
  { path: 'electricity', component: ElectricityComponent }
];