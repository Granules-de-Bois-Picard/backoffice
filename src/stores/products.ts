// src/stores/products.ts
import { defineStore } from 'pinia'
import { productsModule, type Product } from '@/modules/products'

interface ProductsState {
    products: Product[]
    product: Product | null
    bestSellerProduct: Product | null
    currentSearch: string
    loading: boolean
    error: string | null
    pagination: {
        total: number
        currentPage: number
        totalPages: number
        perPage: number
    }
}

export const useProductsStore = defineStore('products', {
    state: (): ProductsState => ({
        products: [],
        product: null,
        bestSellerProduct: null,
        currentSearch: '',
        loading: false,
        error: null,
        pagination: {
            total: 0,
            currentPage: 1,
            totalPages: 1,
            perPage: 12
        }
    }),

    actions: {
        async fetchProducts(page: number = 1, search: string = '') {
            try {
                this.loading = true
                this.currentSearch = search
                const response = await productsModule.getProducts(page, search)
                this.products = response.data.data

                const { pagination } = response.data.meta
                this.pagination = {
                    total: pagination.total,
                    currentPage: pagination.current_page,
                    totalPages: pagination.total_pages,
                    perPage: pagination.per_page
                }

                this.error = null
            } catch (error: any) {
                this.error = error.response?.data?.message || 'An error occurred'
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchProduct(id: string) {
            try {
                this.loading = true
                const response = await productsModule.getProduct(id)
                this.product = response.data.data

                this.error = null
            } catch (error: any) {
                this.error = error.response?.data?.message || 'An error occurred'
                throw error
            } finally {
                this.loading = false
            }
        },

        async createProduct(productData: Partial<Product>) {
            try {
                this.loading = true
                await productsModule.createProduct(productData)

                this.error = null
            } catch (error: any) {
                this.error = error.response?.data?.message || 'An error occurred'
                throw error
            } finally {
                this.loading = false
            }
        },

        async updateProduct(productId: string, productData: Partial<Product>) {
            try {
                this.loading = true
                await productsModule.updateProduct(productId, productData)

                this.error = null
            } catch (error: any) {
                this.error = error.response?.data?.message || 'An error occurred'
                throw error
            } finally {
                this.loading = false
            }
        },

        async deleteProduct(productId: string) {
            try {
                this.loading = true
                await productsModule.deleteProduct(productId)

                this.error = null
            } catch (error: any) {
                this.error = error.response?.data?.message || 'An error occurred'
                throw error
            } finally {
                this.loading = false
            }
        },

        async setBestSeller(productId: string) {
            try {
                this.loading = true
                const response = await productsModule.setBestSeller(productId)
                
                // Update the product in the list
                const updatedProduct = response.data.data
                
                // Reset all products' isBestSeller flag
                this.products = this.products.map(product => ({
                    ...product,
                    isBestSeller: product.id === productId
                }))
                
                // Update current product if it's the one being edited
                if (this.product && this.product.id === productId) {
                    this.product = {
                        ...this.product,
                        isBestSeller: true
                    }
                }
                
                this.bestSellerProduct = updatedProduct
                this.error = null
            } catch (error: any) {
                this.error = error.response?.data?.message || 'An error occurred'
                throw error
            } finally {
                this.loading = false
            }
        },

        async fetchBestSeller() {
            try {
                this.loading = true
                const response = await productsModule.getBestSeller()
                this.bestSellerProduct = response.data.data
                
                // Update the isBestSeller flag for all products in the list
                if (this.bestSellerProduct) {
                    this.products = this.products.map(product => ({
                        ...product,
                        isBestSeller: product.id === this.bestSellerProduct?.id
                    }))
                }
                
                this.error = null
            } catch (error: any) {
                this.error = error.response?.data?.message || 'An error occurred'
                throw error
            } finally {
                this.loading = false
            }
        }
    }
})