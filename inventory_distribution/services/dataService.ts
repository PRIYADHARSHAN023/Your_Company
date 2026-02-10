import { Company, User, Product, Worker, Distribution } from '../types';

// Detect environment: Vercel/Production uses relative path, Local uses port 5000
const API_BASE = (import.meta as any).env.PROD ? '/api' : 'http://localhost:5000/api';

class DataService {

  private getToken(): string | null {
    return localStorage.getItem('yc_token');
  }

  private getCachedCompany(): any {
    const data = localStorage.getItem('yc_company');
    return data ? JSON.parse(data) : null;
  }

  private async request(method: string, endpoint: string, body?: any) {

    const headers: any = {
      'Content-Type': 'application/json'
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // COMPANY
  async getCompany(): Promise<Company | null> {
    try {
      const cached = this.getCachedCompany();
      if (cached) return cached;

      const company = await this.request('GET', '/company');
      const normalized = { ...company, id: company._id || company.id };

      localStorage.setItem('yc_company', JSON.stringify(normalized));
      return normalized;

    } catch {
      return null;
    }
  }

  async setupCompany(name: string): Promise<Company> {
    const company = await this.request('POST', '/company/setup', { name });
    const normalized = { ...company, id: company._id || company.id };

    localStorage.setItem('yc_company', JSON.stringify(normalized));
    return normalized;
  }

  async checkCompany(name: string): Promise<Company | null> {
    try {
      const company = await this.request('POST', '/company/check', { name });
      const normalized = { ...company, id: company._id || company.id };

      // Persist for Registration flow
      localStorage.setItem('yc_company', JSON.stringify(normalized));

      return normalized;
    } catch {
      return null;
    }
  }

  // AUTH
  async registerUser(user: any): Promise<void> {
    await this.request('POST', '/auth/register', user);
  }

  async login(companyName: string, userId: string, password: string): Promise<User | null> {

    try {
      const response = await this.request('POST', '/auth/login', {
        companyName,
        userId,
        password
      });

      localStorage.setItem('yc_token', response.token);
      localStorage.setItem('yc_session_user', JSON.stringify(response.user));
      if (response.company) {
        localStorage.setItem('yc_company', JSON.stringify(response.company));
      }

      return response.user;

    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('yc_token');
    localStorage.removeItem('yc_session_user');
    localStorage.removeItem('yc_company');
    // We clear everything to be safe, or just specific keys. 
    // Ensuring company is gone is critical for the "Switch Company" feature.
  }

  getCurrentUser(): User | null {
    const data = localStorage.getItem('yc_session_user');
    return data ? JSON.parse(data) : null;
  }

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    const products = await this.request('GET', '/products');
    return products.map((p: any) => ({ ...p, id: p._id }));
  }

  async addOrUpdateProduct(product: any): Promise<Product> {
    const result = await this.request('POST', '/products', product);
    return { ...result, id: result._id };
  }

  async bulkAddProducts(products: any[]): Promise<void> {
    for (const product of products) {
      await this.addOrUpdateProduct(product);
    }
  }

  // WORKERS
  async getWorkers(): Promise<Worker[]> {
    const workers = await this.request('GET', '/workers');
    return workers.map((w: any) => ({ ...w, id: w._id }));
  }

  async addWorker(worker: any): Promise<Worker> {
    const result = await this.request('POST', '/workers', worker);
    return { ...result, id: result._id };
  }

  // DISTRIBUTIONS
  async getDistributions(): Promise<Distribution[]> {

    const distributions = await this.request('GET', '/distributions');

    return distributions.map((d: any) => ({
      id: d._id,
      workerId: d.workerId,
      productId: d.productId,
      quantity: d.quantity,
      distributedBy: d.distributedBy,
      distributedAt: d.distributedAt,
      workerName: d.workerName,
      productName: d.productName,
      pricePerUnit: d.pricePerUnit,
      totalAmount: d.totalAmount
    }));
  }

  async createBatchDistribution(worker: Worker, items: any[]): Promise<string> {

    try {
      for (const item of items) {
        await this.request('POST', '/distributions', {
          workerId: worker.id,
          productId: item.productId,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit
        });
      }

      return "success";

    } catch (err: any) {
      return err.message || "Failed";
    }
  }
}

/* 🔥 IMPORTANT FIX */
export const dataService = new DataService();