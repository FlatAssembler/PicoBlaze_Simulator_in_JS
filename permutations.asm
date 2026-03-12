;Compile this with FlatAssembler on Windows. This program relies on the Microsoft Visual C Runtime Library (MSVCRT.DLL) for the input and output.

format PE console
entry start

include 'win32a.inc'

section '.text' code executable

macro store first_register, second_register {
  movzx ebx, [second_register]
  mov al, [first_register]
  mov [linear_memory + ebx], al
}

macro fetch first_register, second_register {
  movzx ebx, [second_register]
  mov al, [linear_memory + ebx]
  mov [first_register], al
}

NDEBUG = 1
address_of_the_current_attempt = 8
digits_of_the_ordinal_number = 16
bottom_of_the_stack = 24
rely_on_sorting_working_correctly = 1
maximal_length_of_the_output = 30000

start:

jmp introduction_string$
  introduction_string db "Enter a short string and press enter.", 10, 0
introduction_string$:
mov [string_to_be_printed], introduction_string
call print_string

;Initialize length_of_the_input to 0
mov [length_of_the_input], 0

beginning_of_the_input_loop:
  call UART_RX
  cmp al, 10 ; newline character
  je end_of_the_input_loop
  mov [regbank_a_s9], al
  movzx ebx, [length_of_the_input]
  mov al, [regbank_a_s9]
  mov [linear_memory + ebx], al
  add [length_of_the_input], 1
  jmp beginning_of_the_input_loop

end_of_the_input_loop:
cmp [length_of_the_input], 0
je exit_program

;An improved version of BubbleSort
beginning_of_the_bubble_sort:
  mov [regbank_a_s5], [length_of_the_input]
  
outer_bubble_sort_loop:
  sub [regbank_a_s5], 1
  cmp [regbank_a_s5], 0
  je end_of_the_bubble_sort
  mov [regbank_a_s4], 0 ; Indicates swap(s) performed.
  mov [regbank_a_s1], 0
  
inner_bubble_sort_loop:
  movzx eax, [regbank_a_s1]
  movzx ebx, [regbank_a_s5]
  cmp eax, ebx
  jnc end_of_the_inner_bubble_sort_loop
  mov [regbank_a_s0], [regbank_a_s1]
  add [regbank_a_s1], 1
  movzx ebx, [regbank_a_s0]
  mov al, [linear_memory + ebx]
  mov [regbank_a_s2], al
  movzx ebx, [regbank_a_s1]
  mov al, [linear_memory + ebx]
  mov [regbank_a_s3], al
  cmp [regbank_a_s3], [regbank_a_s2]
  jnc inner_bubble_sort_loop
  mov [regbank_a_s3], [regbank_a_s2] ; swap
  mov [regbank_a_s2], [regbank_a_s3]
  movzx ebx, [regbank_a_s0]
  mov al, [regbank_a_s3]
  mov [linear_memory + ebx], al
  movzx ebx, [regbank_a_s1]
  mov al, [regbank_a_s2]
  mov [linear_memory + ebx], al
  mov [regbank_a_s4], 1
  jmp inner_bubble_sort_loop
  
end_of_the_inner_bubble_sort_loop:
  cmp [regbank_a_s4], 0
  jne outer_bubble_sort_loop

end_of_the_bubble_sort:

cmp [NDEBUG], 1
je the_permutations_algorithm

printing_the_sorted_array:
jmp sorted_array_string$
  sorted_array_string db "After the Bubble Sort algorithm, the input string looks like this: ", 0
sorted_array_string$:
mov [string_to_be_printed], sorted_array_string
call print_string
mov [regbank_a_s0], 0

printing_the_sorted_array_loop:
  cmp [regbank_a_s0], [length_of_the_input]
  jnc end_of_the_printing_the_sorted_array_loop
  movzx ebx, [regbank_a_s0]
  mov al, [linear_memory + ebx]
  call UART_TX
  add [regbank_a_s0], 1
  jmp printing_the_sorted_array_loop

end_of_the_printing_the_sorted_array_loop:
mov al, 10
call UART_TX

the_permutations_algorithm:

; Let's set all the digits of the ordinal number of permutations to "0"
mov [regbank_b_s0], digits_of_the_ordinal_number
mov [regbank_b_s2], digits_of_the_ordinal_number ; End of the digits of the ordinal number.

reset_ordinal_numbers_loop:
  cmp [regbank_b_s0], bottom_of_the_stack
  jnc end_of_the_reset_ordinal_numbers_loop
  mov [regbank_b_s1], '0'
  movzx ebx, [regbank_b_s0]
  mov al, [regbank_b_s1]
  mov [linear_memory + ebx], al
  add [regbank_b_s0], 1
  jmp reset_ordinal_numbers_loop

end_of_the_reset_ordinal_numbers_loop:

mov [top_of_the_stack], bottom_of_the_stack
mov [regbank_a_s0], 0
movzx ebx, [top_of_the_stack]
mov al, [regbank_a_s0]
mov [linear_memory + ebx], al
add [top_of_the_stack], [length_of_the_input]
add [top_of_the_stack], 1

beginning_of_the_permutations_loop:
  cmp [top_of_the_stack], bottom_of_the_stack
  je end_of_the_permutations_loop
  sub [top_of_the_stack], [length_of_the_input]
  sub [top_of_the_stack], 1
  
  movzx ebx, [top_of_the_stack]
  mov al, [linear_memory + ebx]
  mov [length_of_the_current_attempt], al
  mov [regbank_a_s0], address_of_the_current_attempt
  mov al, [length_of_the_current_attempt]
  movzx ebx, [regbank_a_s0]
  mov [linear_memory + ebx], al
  mov [regbank_a_s1], 0
  
copying_the_current_attempt_from_the_stack_loop:
  cmp [regbank_a_s1], [length_of_the_current_attempt]
  jnc end_of_copying
  mov [regbank_a_s0], address_of_the_current_attempt
  add [regbank_a_s0], [regbank_a_s1]
  add [regbank_a_s0], 1
  mov [regbank_a_s3], [top_of_the_stack]
  add [regbank_a_s3], [regbank_a_s1]
  add [regbank_a_s3], 1
  movzx ebx, [regbank_a_s3]
  mov al, [linear_memory + ebx]
  mov [regbank_a_s4], al
  movzx ebx, [regbank_a_s0]
  mov al, [regbank_a_s4]
  mov [linear_memory + ebx], al
  add [regbank_a_s1], 1
  jmp copying_the_current_attempt_from_the_stack_loop

end_of_copying:
cmp [NDEBUG], 1
je dont_print_the_current_attempt

print_the_current_attempt:
jmp length_msg_string$
  length_msg_string db "The length of the current attempt is: ", 0
length_msg_string$:
mov [string_to_be_printed], length_msg_string
call print_string
mov al, [length_of_the_current_attempt]
add al, '0'
call UART_TX
mov al, 10
call UART_TX

jmp attempt_msg_string$
  attempt_msg_string db "The current attempt is: ", 0
attempt_msg_string$:
mov [string_to_be_printed], attempt_msg_string
call print_string
mov [regbank_a_s0], address_of_the_current_attempt + 1

printing_the_current_attempt_loop:
  mov [regbank_a_s1], address_of_the_current_attempt + 1
  add [regbank_a_s1], [length_of_the_current_attempt]
  cmp [regbank_a_s0], [regbank_a_s1]
  jnc end_of_the_printing_the_current_attempt_loop
  movzx ebx, [regbank_a_s0]
  mov al, [linear_memory + ebx]
  call UART_TX
  add [regbank_a_s0], 1
  jmp printing_the_current_attempt_loop

end_of_the_printing_the_current_attempt_loop:
mov al, 10
call UART_TX

dont_print_the_current_attempt:
cmp [length_of_the_current_attempt], [length_of_the_input]
jl current_attempt_is_not_a_solution

  jmp found_solution_string$
    found_solution_string db "Found a permutation: ", 0
  found_solution_string$:
  mov [string_to_be_printed], found_solution_string
  call print_string
  mov [regbank_a_s0], address_of_the_current_attempt + 1

  printing_the_solution_loop:
    mov [regbank_a_s1], address_of_the_current_attempt + 1
    add [regbank_a_s1], [length_of_the_current_attempt]
    cmp [regbank_a_s0], [regbank_a_s1]
    jnc end_of_the_printing_the_solution_loop
    movzx ebx, [regbank_a_s0]
    mov al, [linear_memory + ebx]
    call UART_TX
    add [regbank_a_s0], 1
    jmp printing_the_solution_loop
  end_of_the_printing_the_solution_loop:
  mov al, 10
  call UART_TX

  ; Increment ordinal number (in regbank b)
  mov [regbank_b_s1], [digits_of_the_ordinal_number]

  increasing_the_ordinal_number_loop:
    movzx ebx, [regbank_b_s1]
    mov al, [linear_memory + ebx]
    add al, 1
    mov [linear_memory + ebx], al
    cmp al, '9' + 1
    jne end_of_increasing_the_ordinal_number_loop
    mov al, '0'
    mov [linear_memory + ebx], al
    add [regbank_b_s1], 1
    jmp increasing_the_ordinal_number_loop

  end_of_increasing_the_ordinal_number_loop:
  cmp [regbank_b_s1], [regbank_b_s2]
    jl not_a_new_digit
    mov [regbank_b_s2], [regbank_b_s1]
  not_a_new_digit:

  jmp ordinal_msg_string$
    ordinal_msg_string db "That's the permutation #", 0
  ordinal_msg_string$:
  mov [string_to_be_printed], ordinal_msg_string
  call print_string

  mov [regbank_b_s1], [regbank_b_s2]
  printing_the_ordinal_number:
    movzx ebx, [regbank_b_s1]
    mov al, [linear_memory + ebx]
    call UART_TX
    sub [regbank_b_s1], 1
    cmp [regbank_b_s1], digits_of_the_ordinal_number
    jnc printing_the_ordinal_number

  mov al, 10
  call UART_TX
  jmp end_of_the_branching

current_attempt_is_not_a_solution:
  mov [regbank_a_s0], [length_of_the_input]
  sub [regbank_a_s0], 1

add_a_new_character_loop:
  movzx ebx, [regbank_a_s0]
  mov al, [linear_memory + ebx]
  mov [character_we_try_to_add], al
  mov [regbank_a_s7], [regbank_a_s0]
  add [regbank_a_s7], 1

  cmp [rely_on_sorting_working_correctly], 1
  je dont_loop_toward_the_end

  loop_toward_the_end:
    mov [regbank_a_s8], 0 ; Whether we already tried adding that character.
    check_if_we_already_tried_that_character_loop:
      cmp [regbank_a_s7], [length_of_the_input]
      jnc end_of_the_check_if_we_already_tried_that_character_loop
      movzx ebx, [regbank_a_s7]
      mov al, [linear_memory + ebx]
      mov [regbank_a_s6], al
      cmp [regbank_a_s6], [character_we_try_to_add]
      jne third_characters_are_not_equal_label
        mov [regbank_a_s8], 1
      third_characters_are_not_equal_label:
      add [regbank_a_s7], 1
      jmp check_if_we_already_tried_that_character_loop
    end_of_the_check_if_we_already_tried_that_character_loop:
    jmp test_whether_s8_is_set_to_1

  dont_loop_toward_the_end:
    mov [regbank_a_s8], 0
    cmp [regbank_a_s7], [length_of_the_input]
    jnc test_whether_s8_is_set_to_1
    movzx ebx, [regbank_a_s7]
    mov al, [linear_memory + ebx]
    mov [regbank_a_s6], al
    cmp [character_we_try_to_add], [regbank_a_s6]
    jne fourth_characters_are_not_equal_label
      mov [regbank_a_s8], 1
    fourth_characters_are_not_equal_label:

  test_whether_s8_is_set_to_1:
  cmp [regbank_a_s8], 0
  jne dont_add_the_new_character

  cmp [NDEBUG], 1
  je dont_print_the_character_we_are_trying_to_add

  print_the_character_we_are_trying_to_add:
    jmp trying_char_string$
      trying_char_string db "We are trying to add the character: ", 0
    trying_char_string$:
    mov [string_to_be_printed], trying_char_string
    call print_string
    mov al, [character_we_try_to_add]
    call UART_TX
    mov al, 10
    call UART_TX

  dont_print_the_character_we_are_trying_to_add:
  mov [regbank_a_s2], 0 ; How many of the chosen character are present in the current attempt.
  mov [regbank_a_s1], address_of_the_current_attempt + 1

  count_in_the_current_attempt_loop:
    mov [regbank_a_s4], address_of_the_current_attempt + 1
    add [regbank_a_s4], [length_of_the_current_attempt]
    cmp [regbank_a_s1], [regbank_a_s4]
    je end_of_the_count_in_the_current_attempt_loop
    movzx ebx, [regbank_a_s1]
    mov al, [linear_memory + ebx]
    mov [regbank_a_s4], al
    cmp [regbank_a_s4], [character_we_try_to_add]
    jne first_the_characters_are_not_equal_label
      add [regbank_a_s2], 1
    first_the_characters_are_not_equal_label:
    add [regbank_a_s1], 1
    jmp count_in_the_current_attempt_loop

  end_of_the_count_in_the_current_attempt_loop:
  cmp [NDEBUG], 1
  je dont_print_how_many_in_the_current_attempt

  print_how_many_in_the_current_attempt:
    jmp current_count_string$
      current_count_string db "The count of that character in the current attempt is: ", 0
    current_count_string$:
    mov [string_to_be_printed], current_count_string
    call print_string
    mov al, [regbank_a_s2]
    add al, '0'
    call UART_TX
    mov al, 10
    call UART_TX

  dont_print_how_many_in_the_current_attempt:
  mov [regbank_a_s3], 0 ; How many of the chosen character are present in the input.
  mov [regbank_a_s1], 0

  count_in_the_input_loop:
    cmp [regbank_a_s1], [length_of_the_input]
    je end_of_the_count_in_the_input_loop
    movzx ebx, [regbank_a_s1]
    mov al, [linear_memory + ebx]
    mov [regbank_a_s4], al
    cmp [regbank_a_s4], [character_we_try_to_add]
    jne second_the_characters_are_not_equal_label
      add [regbank_a_s3], 1
    second_the_characters_are_not_equal_label:
    add [regbank_a_s1], 1
    jmp count_in_the_input_loop

  end_of_the_count_in_the_input_loop:
  cmp [NDEBUG], 1
  je dont_print_how_many_in_the_input

  print_how_many_in_the_input:
    jmp input_count_string$
      input_count_string db "The count of that character in the input string is: ", 0
    input_count_string$:
    mov [string_to_be_printed], input_count_string
    call print_string
    mov al, [regbank_a_s3]
    add al, '0'
    call UART_TX
    mov al, 10
    call UART_TX

  dont_print_how_many_in_the_input:
  cmp [regbank_a_s2], [regbank_a_s3]
  jnc dont_add_the_new_character

    mov [regbank_a_s1], [NDEBUG]
    cmp [regbank_a_s1], 0
    jne skip_adding_msg
    jmp adding_msg_string$
      adding_msg_string db "We will try to add that character.", 10, 0
    adding_msg_string$:
    mov [string_to_be_printed], adding_msg_string
    call print_string
    skip_adding_msg:

    mov [regbank_a_s1], [top_of_the_stack]
    mov [regbank_a_s2], [length_of_the_current_attempt]
    add [regbank_a_s2], 1
    movzx ebx, [regbank_a_s1]
    mov al, [regbank_a_s2]
    mov [linear_memory + ebx], al
    add [regbank_a_s1], 1

    mov [regbank_a_s3], address_of_the_current_attempt + 1

    copying_the_new_attempt_loop:
      mov [regbank_a_s5], address_of_the_current_attempt + 1
      add [regbank_a_s5], [length_of_the_current_attempt]
      cmp [regbank_a_s3], [regbank_a_s5]
      je end_of_the_copying_the_new_attempt_loop
      movzx ebx, [regbank_a_s3]
      mov al, [linear_memory + ebx]
      mov [regbank_a_s4], al
      movzx ebx, [regbank_a_s1]
      mov al, [regbank_a_s4]
      mov [linear_memory + ebx], al
      add [regbank_a_s3], 1
      add [regbank_a_s1], 1
      jmp copying_the_new_attempt_loop

    end_of_the_copying_the_new_attempt_loop:
    ; s1 now points to the location right after the copied attempt.
    movzx ebx, [regbank_a_s1]
    mov al, [character_we_try_to_add]
    mov [linear_memory + ebx], al
    add [top_of_the_stack], [length_of_the_input]
    add [top_of_the_stack], 1

  dont_add_the_new_character:
  sub [regbank_a_s0], 1
  cmp [regbank_a_s0], 0
  jnc add_a_new_character_loop

end_of_the_add_a_new_character_loop:
mov [regbank_a_sb], [NDEBUG]
cmp [regbank_a_sb], 0
jne skip_exit_msg
jmp exit_msg_string$
  exit_msg_string db "The 'add_a_new_character_loop' loop has exited!", 10, 0
exit_msg_string$:
mov [string_to_be_printed], exit_msg_string
call print_string
skip_exit_msg:

end_of_the_branching:
jmp beginning_of_the_permutations_loop

end_of_the_permutations_loop:
jmp end_msg_string$
  end_msg_string db "The end!", 10, 0
end_msg_string$:
mov [string_to_be_printed], end_msg_string
call print_string

exit_program:
mov eax, [esp]
call [ExitProcess]

section '.data' writeable
  length_of_the_input db 0
  top_of_the_stack db 0
  length_of_the_current_attempt db 0
  character_we_try_to_add db 0
  string_to_be_printed dd 0
  regbank_a_s0 db 0
  regbank_a_s1 db 0
  regbank_a_s2 db 0
  regbank_a_s3 db 0
  regbank_a_s4 db 0
  regbank_a_s5 db 0
  regbank_a_s6 db 0
  regbank_a_s7 db 0
  regbank_a_s8 db 0
  regbank_a_s9 db 0
  regbank_a_sb db 0
  regbank_b_s0 db 0
  regbank_b_s1 db 0
  regbank_b_s2 db 0
  linear_memory rb 4096

include 'win32a.inc'

print_string:
  ;TODO: implement print_string
return

UART_RX:
  ;TODO: implement UART_RX - should read from stdin
return

UART_TX:
  ;TODO: implement UART_TX - should write to stdout
  mov eax, 4
  mov ebx, 1
  mov ecx, [regbank_a_s9]
  mov edx, 1
  int 0x80
return