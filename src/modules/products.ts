// src/modules/products.ts
import api from '@/plugins/api'

export interface Product {
    id: string
    name: string
    thumbnail_url: string
    type: string
    brand: string
    model: string
    dimensions: string
    weight: string
    certifications: string
    availableColors: string[]
    hasWifiCompatibility: boolean
    created_at: string
    updated_at: string
}

interface ProductsResponse {
    success: boolean
    message: string
    data: Product[]
    meta: {
        pagination: {
            total: number
            count: number
            per_page: number
            current_page: number
            total_pages: number
            links: Record<string, string>
        }
    }
}

export const productsModule = {
    getProducts(page: number = 1, search: string = '') {
        const searchQuery = search ? `&search=${search}` : ''
        return api.get<ProductsResponse>(`/products?page=${page}${searchQuery}`)
    },

    getProduct(id: string) {
        return api.get<{success: boolean, data: Product}>(`/products/${id}`)
    },

    createProduct(productData: Partial<Product>) {
        return api.post<{success: boolean, data: Product}>('/products', productData)
    },

    updateProduct(id: string, productData: Partial<Product>) {
        return api.put<{success: boolean, data: Product}>(`/products/${id}`, productData)
    },

    deleteProduct(id: string) {
        return api.delete<{success: boolean, message: string}>(`/products/${id}`)
    }
}