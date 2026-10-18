// src/components/Cargos/hooks/useNavigation.ts
import { useCallback } from 'react'
import { useNavigateStore } from '../../../Store/navigateStore'
import type { CargoInfo } from '../../../Store/cargoStore'

export const useCargoNavigation = () => {
    const currentPage         = useNavigateStore(state => state.currentPage)
    const navigateTo          = useNavigateStore(state => state.navigateTo)
    const replaceCurrentPage  = useNavigateStore(state => state.replaceCurrentPage)
    const goBack              = useNavigateStore(state => state.goBack)

    const handleCreateNew = useCallback(() => {

        navigateTo({ type: 'create' })

    }, [navigateTo])

    const handleEdit = useCallback(( item ) => {

        navigateTo({ type: 'edit', cargo: item })

    }, [navigateTo])

    const handleCargoClick = useCallback((cargo: CargoInfo) => {

        navigateTo({ type: 'view', cargo })
        
    }, [navigateTo])

    return {
        currentPage,
        navigateTo,
        replaceCurrentPage,
        goBack,
        handleCreateNew,
        handleEdit,
        handleCargoClick
    }
}