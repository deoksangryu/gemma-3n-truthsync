import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  constructor(private router: Router, private userService: UserService) {}

  login() {
    this.loading = true;
    setTimeout(() => {
      this.userService.setUser({ name: '김기자', email: this.email });
      this.router.navigate(['/home']);
    }, 500);
  }
}
