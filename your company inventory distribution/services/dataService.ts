
import { Company, User, Product, Worker, Distribution } from '../types';

class DataService {
  private get(key: string): any[] {
    return JSON.parse(localStorage.getItem(`yc_db_${key}`) || '[]');
  }

  private save(key: string, data: any): void {
    localStorage.setItem(`yc_db_${key}`, JSON.stringify(data));
  }

  // Improved unique ID generator to prevent collisions during rapid operations
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  async setupCompany(name: string): Promise<Company> {
    const company = { id: this.generateId('ent'), name, createdAt: new Date().toISOString() };
    localStorage.setItem('yc_company_data', JSON.stringify(company));
    return company;
  }

  async getCompany(): Promise<Company | null> {
    const data = localStorage.getItem('yc_company_data');
    return data ? JSON.parse(data) : null;
  }

  async registerUser(user: any): Promise<void> {
    const users = this.get('users');
    const newUser = { 
      ...user, 
      id: this.generateId('u'), 
      createdAt: new Date().toISOString() 
    };
    users.push(newUser);
    this.save('users', users);
  }

  async login(userId: string, password?: string): Promise<User | null> {
    const users = this.get('users');
    const user = users.find((u: any) => u.userId === userId);
    
    if (!user) return null;
    
    const sessionUser = { ...user };
    delete sessionUser.password;
    
    localStorage.setItem('yc_token', 'local-session-token');
    localStorage.setItem('yc_session_user', JSON.stringify(sessionUser));
    return sessionUser;
  }

  logout(): void {
    localStorage.removeItem('yc_token');
    localStorage.removeItem('yc_session_user');
  }

  getCurrentUser(): User | null {
    const data = localStorage.getItem('yc_session_user');
    return data ? JSON.parse(data) : null;
  }

  async getProducts(): Promise<Product[]> {
    return this.get('products');
  }

  async addOrUpdateProduct(product: any): Promise<Product> {
    let products = this.get('products');
    // Ensure case-insensitive check for existing products
    const idx = products.findIndex((p: any) => p.productName.trim().toLowerCase() === product.productName.trim().toLowerCase());
    
    let result: any;
    if (idx > -1) {
      // Update existing
      products[idx].totalStock += product.totalStock;
      products[idx].updatedAt = new Date().toISOString();
      // Ensure category is updated if changed
      products[idx].category = product.category || products[idx].category;
      result = products[idx];
    } else {
      // Create new with guaranteed unique ID
      result = { 
        ...product, 
        id: this.generateId('p'), 
        updatedAt: new Date().toISOString() 
      };
      products.push(result);
    }
    
    this.save('products', products);
    return result;
  }

  async bulkAddProducts(items: any[]): Promise<void> {
    for (const item of items) {
      await this.addOrUpdateProduct(item);
    }
  }

  async getWorkers(): Promise<Worker[]> {
    return this.get('workers');
  }

  async addWorker(worker: any): Promise<Worker> {
    let workers = this.get('workers');
    const newWorker = { ...worker, id: this.generateId('w') };
    workers.push(newWorker);
    this.save('workers', workers);
    return newWorker;
  }

  async getDistributions(): Promise<Distribution[]> {
    return this.get('distributions');
  }

  async createBatchDistribution(worker: Worker, items: { productId: string; quantity: number }[]): Promise<string> {
    let products = this.get('products');
    let distributions = this.get('distributions');
    const currentUser = this.getCurrentUser();

    // Verification Layer: Ensure all IDs are valid and quantities are available
    for (const item of items) {
      const prod = products.find((p: any) => p.id === item.productId);
      if (!prod) return `Product identity error for ID: ${item.productId}`;
      if (prod.totalStock < item.quantity) {
        return `Insufficient stock for ${prod.productName}. Requested: ${item.quantity}, Available: ${prod.totalStock}`;
      }
    }

    // Execution Layer: Update inventory and log distributions
    for (const item of items) {
      const pIdx = products.findIndex((p: any) => p.id === item.productId);
      products[pIdx].totalStock -= item.quantity;
      
      distributions.push({
        id: this.generateId('dist'),
        workerId: worker.id,
        workerName: worker.name,
        productId: item.productId,
        productName: products[pIdx].productName,
        quantity: item.quantity,
        distributedBy: currentUser?.name || 'System Administrator',
        distributedAt: new Date().toISOString()
      });
    }

    this.save('products', products);
    this.save('distributions', distributions);
    return "success";
  }
}

export const dataService = new DataService();
