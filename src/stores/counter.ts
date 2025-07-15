import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

export const useBookStore = defineStore('book', () => {
    const book = ref({
      id: '',
      isbn: '',
      cover: '',
      name: '',
      price: '',
      author: '',
      publisher: '',
      createTime: '',
      borrownum: '0',
      status: '1',
    })

    return { book }
})

export const useUserStore = defineStore('user', () => {
  const user = ref({
    id: '',
    username: '',
    nickName: '',
    sex: '',
    address: '',
    phone: ''
  })

  return {user}
})