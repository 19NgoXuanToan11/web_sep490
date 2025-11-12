import { type StateCreator } from 'zustand'
import { mapErrorToVietnamese } from '@/shared/lib/error-handler'

export interface CrudService<T> {
  getAll: (params?: any) => Promise<{ items: T[]; totalCount: number }>
  getById: (id: string | number) => Promise<T>
  create: (data: any) => Promise<T>
  update: (id: string | number, data: any) => Promise<T>
  delete: (id: string | number) => Promise<void>
}

export interface LoadingState {
  isLoading: boolean
  error?: string
}

export interface CrudState<T> {

  items: T[]
  selectedItem: T | null

  loadingStates: Record<string, LoadingState>

  fetchAll: (params?: any) => Promise<void>
  fetchById: (id: string | number) => Promise<T>
  create: (data: any) => Promise<T>
  update: (id: string | number, data: any) => Promise<T>
  delete: (id: string | number) => Promise<void>
  setSelectedItem: (item: T | null) => void
  setLoadingState: (key: string, state: LoadingState) => void
}

export const createCrudStore =
  <T>(service: CrudService<T>, storeName: string): StateCreator<CrudState<T>> =>
  (set, get) => ({

    items: [],
    selectedItem: null,
    loadingStates: {},

    fetchAll: async (params?: any) => {
      const key = `${storeName}-fetch-all`
      get().setLoadingState(key, { isLoading: true })

      try {
        const response = await service.getAll(params)
        set({
          items: response.items,
        })
        get().setLoadingState(key, { isLoading: false })
      } catch (error) {
        const errorMessage = mapErrorToVietnamese(error)
        get().setLoadingState(key, {
          isLoading: false,
          error: errorMessage.vietnamese,
        })
        throw error
      }
    },

    fetchById: async (id: string | number) => {
      const key = `${storeName}-fetch-${id}`
      get().setLoadingState(key, { isLoading: true })

      try {
        const item = await service.getById(id)
        set({ selectedItem: item })
        get().setLoadingState(key, { isLoading: false })
        return item
      } catch (error) {
        const errorMessage = mapErrorToVietnamese(error)
        get().setLoadingState(key, {
          isLoading: false,
          error: errorMessage.vietnamese,
        })
        throw error
      }
    },

    create: async (data: any) => {
      const key = `${storeName}-create`
      get().setLoadingState(key, { isLoading: true })

      try {
        const newItem = await service.create(data)

        set(state => ({
          items: [...state.items, newItem],
        }))

        get().setLoadingState(key, { isLoading: false })
        return newItem
      } catch (error) {
        const errorMessage = mapErrorToVietnamese(error)
        get().setLoadingState(key, {
          isLoading: false,
          error: errorMessage.vietnamese,
        })
        throw error
      }
    },

    update: async (id: string | number, data: any) => {
      const key = `${storeName}-update-${id}`
      get().setLoadingState(key, { isLoading: true })

      try {
        const updatedItem = await service.update(id, data)

        set(state => ({
          items: state.items.map(item => ((item as any).id === id ? updatedItem : item)),
          selectedItem:
            state.selectedItem && (state.selectedItem as any).id === id
              ? updatedItem
              : state.selectedItem,
        }))

        get().setLoadingState(key, { isLoading: false })
        return updatedItem
      } catch (error) {
        const errorMessage = mapErrorToVietnamese(error)
        get().setLoadingState(key, {
          isLoading: false,
          error: errorMessage.vietnamese,
        })
        throw error
      }
    },

    delete: async (id: string | number) => {
      const key = `${storeName}-delete-${id}`
      get().setLoadingState(key, { isLoading: true })

      try {
        await service.delete(id)

        set(state => ({
          items: state.items.filter(item => (item as any).id !== id),
          selectedItem:
            state.selectedItem && (state.selectedItem as any).id === id ? null : state.selectedItem,
        }))

        get().setLoadingState(key, { isLoading: false })
      } catch (error) {
        const errorMessage = mapErrorToVietnamese(error)
        get().setLoadingState(key, {
          isLoading: false,
          error: errorMessage.vietnamese,
        })
        throw error
      }
    },

    setSelectedItem: (item: T | null) => {
      set({ selectedItem: item })
    },

    setLoadingState: (key: string, state: LoadingState) => {
      set(currentState => ({
        loadingStates: {
          ...currentState.loadingStates,
          [key]: state,
        },
      }))
    },
  })
