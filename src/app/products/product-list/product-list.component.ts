import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable, EMPTY, combineLatest, Subscription } from 'rxjs';
import { tap, catchError, startWith, count, flatMap, map, debounceTime, filter, distinctUntilChanged, shareReplay } from 'rxjs/operators';

import { Product } from '../product.interface';
import { ProductService } from '../product.service';
import { FavouriteService } from '../favourite.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  //subscription = new Subscription();

  title: string = 'Products';
  selectedProduct: Product;

  newFavourite$: Observable<Product>;
  products$: Observable<Product[]>;
  productsNumber$: Observable<number>;
  filter$: Observable<string>;
  filteredProducts$: Observable<Product[]>;
  filtered$: Observable<boolean>;

  errorMessage;

  filter: FormControl = new FormControl("");

  // Pagination
  pageSize = 5;
  start = 0;
  end = this.pageSize;
  currentPage = 1;

  firstPage() {
    this.start = 0;
    this.end = this.pageSize;
    this.currentPage = 1;
  }

  previousPage() {
    this.start -= this.pageSize;
    this.end -= this.pageSize;
    this.currentPage--;
    this.selectedProduct = null;
  }

  nextPage() {
    this.start += this.pageSize;
    this.end += this.pageSize;
    this.currentPage++;
    this.selectedProduct = null;
  }

  onSelect(product: Product) {
    this.selectedProduct = product;
    this.router.navigateByUrl('/products/' + product.id);
  }

  get favourites(): number {
    return this.favouriteService.getFavouritesNb();
  }

  constructor(
    private productService: ProductService,
    private favouriteService: FavouriteService,
    private router: Router,
    private loadingService: LoadingService) {
  }

  // ngOnDestroy(): void {
  //     this.subscription.unsubscribe();
  // }

  ngOnInit(): void {
  //  this.subscription.add(
      this.newFavourite$ =
          this
            .favouriteService
            .favouriteAdded$
            .pipe(
              tap(product => console.log("Nouveau produit favoris: " + product?.name))
            );
            // .subscribe(
            //   product => this.newFavourite = product
            // )
   // )

    // Self url navigation will refresh the page ('Refresh List' button)
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.products$ = this
                      .productService
                      .products$;

    this.loadingService.showLoaderUntilCompleted(this.products$);

    this.filter$ = this.filter
                        .valueChanges
                        .pipe(
                          map(text => text.trim()),
                          filter(text => text == "" || text.length > 3),
                          debounceTime(500),
                          distinctUntilChanged(),
                          startWith(""),
                          tap(text => {
                              console.warn(text);
                              this.firstPage();
                            }
                           ),
                           shareReplay()
                        );

    this.filtered$ = this
                        .filter$
                        .pipe(
                          map(text => text.length > 0)
                        );

    this.filteredProducts$ = combineLatest([this.products$, this.filter$])
        .pipe(
          map(([products, filterString]) =>
            products.filter(product =>
              product.name.toLowerCase().includes(filterString.toLowerCase())
            )
          )
        )

    this.productsNumber$ = this
                            .filteredProducts$
                            .pipe(
                              map(products => products.length),
                              startWith(0)
                            );

  }

  refresh() {
    this.productService.initProducts();
    this.router.navigateByUrl('/products'); // Self route navigation
  }
}
