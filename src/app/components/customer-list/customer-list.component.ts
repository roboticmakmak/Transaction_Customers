import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle } from 'ng-apexcharts';

export interface Customer {
  id: number;
  name: string;
}

export interface Transaction {
  id: number;
  customer_id: number;
  date: string;
  amount: number;
}

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'total_amount', 'actions'];
  dataSource: MatTableDataSource<any>;
  transactionColumns: string[] = ['id', 'customer_id', 'date', 'amount'];
  transactionDataSource: MatTableDataSource<Transaction>;
  customers: Customer[];
  transactions: Transaction[];
  selectedCustomer: Customer | null = null;
  chartOptions: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    title: ApexTitleSubtitle;
  };

  constructor(private http: HttpClient) {
    this.customers = [];
    this.transactions = [];

    this.dataSource = new MatTableDataSource();
    this.transactionDataSource = new MatTableDataSource();

    this.chartOptions = {
      series: [],
      chart: {
        type: 'line',
        height: 350,
        width: '100%'
      },
      xaxis: {
        categories: []
      },
      title: {
        text: 'Transactions'
      }
    };

    this.loadData();
  }

  loadData() {
    this.http.get<any>('assets/data.json').subscribe(data => {
      this.customers = data.customers;
      this.transactions = data.transactions;

      const aggregatedData = this.customers.map(customer => {
        const customerTransactions = this.transactions.filter(t => t.customer_id === customer.id);
        const totalAmount = customerTransactions.reduce((acc, curr) => acc + curr.amount, 0);
        return {
          id: customer.id,
          name: customer.name,
          total_amount: totalAmount
        };
      });

      this.dataSource.data = aggregatedData;
    });
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewGraph(customer_id: number) {
    const customer = this.customers.find(c => c.id === customer_id);
    if (customer) {
      this.selectedCustomer = customer;
      const customerTransactions = this.transactions.filter(t => t.customer_id === customer_id);

      this.chartOptions.series = [
        {
          name: 'Amount',
          data: customerTransactions.map(t => t.amount)
        }
      ];

      this.chartOptions.xaxis = {
        categories: customerTransactions.map(t => t.date)
      };
    } else {
      console.error(`Customer with ID ${customer_id} not found.`);
    }
  }

  viewDetails(customer_id: number) {
    const customerTransactions = this.transactions.filter(t => t.customer_id === customer_id);
    this.transactionDataSource.data = customerTransactions;
  }

  closeTransactionDetails() {
    this.transactionDataSource.data = [];
  }
}
