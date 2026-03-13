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
should_we_print_chessboards = 1
size_of_the_chessboard = 8
address_of_the_current_attempt = 0
digits_of_the_ordinal_number = 10
bottom_of_the_stack = 16
maximal_length_of_the_output = 30000

start:

jmp searching_for_solutions_string$
  searching_for_solutions_string db "Searching for solutions...", 10, 0 ; When FlatAssembler supports no escape characters in string, such as '\n'.
searching_for_solutions_string$:
mov [string_to_be_printed], searching_for_solutions_string
call print_string

;Let's set all the digits of the ordinal number of solutions to "0"
mov [regbank_b_s0], digits_of_the_ordinal_number
mov [regbank_b_s2], digits_of_the_ordinal_number ;End of the digits of the ordinal number.
reset_ordinal_numbers_loop:
  cmp [regbank_b_s0], bottom_of_the_stack
  jnc end_of_the_reset_ordinal_numbers_loop
  mov [regbank_b_s1], '0'
  store regbank_b_s1, regbank_b_s0
  add [regbank_b_s0], 1
  jmp reset_ordinal_numbers_loop
end_of_the_reset_ordinal_numbers_loop:

mov [top_of_the_stack], bottom_of_the_stack
mov [s0], 0
store s0, top_of_the_stack
add [top_of_the_stack], size_of_the_chessboard + 1

main_loop:
  cmp [top_of_the_stack], bottom_of_the_stack
  jz end_of_the_main_loop
  sub [top_of_the_stack], size_of_the_chessboard + 1

  fetch length_of_the_current_attempt, top_of_the_stack
  mov [s0], address_of_the_current_attempt
  store length_of_the_current_attempt, s0
  mov al, [top_of_the_stack]
  mov [s1], al
  mov [s2], 0

  copying_the_current_attempt_from_the_stack_loop:
    mov al, [length_of_the_current_attempt]
    cmp [s2], al
    jz end_of_copying_the_current_attempt_from_the_stack_loop
    add [s2], 1
    add [s0], 1
    add [s1], 1
    fetch s3, s1
    store s3, s0
    jmp copying_the_current_attempt_from_the_stack_loop
  end_of_copying_the_current_attempt_from_the_stack_loop:

  mov [s0], NDEBUG
  mov al, [s0]
  test al, al
  jnz dont_print_the_current_attempt
  
  jmp current_attempt_is_string$
    current_attempt_is_string db "The current attempt is: ", 0
  current_attempt_is_string$:
  mov [string_to_be_printed], current_attempt_is_string
  call print_string
  call print_the_current_attempt
  dont_print_the_current_attempt:
  
  cmp [length_of_the_current_attempt], size_of_the_chessboard
  jnz not_a_solution
    jmp found_a_solution_string$
      found_a_solution_string db "Found a solution: ", 0
    found_a_solution_string$:
    mov [string_to_be_printed], found_a_solution_string
    call print_string
    call print_the_current_attempt
    
    if should_we_print_chessboards
      jmp print_the_chessboard
    else
      jmp dont_print_the_chessboard
    end if
    print_the_chessboard:
    mov [s6], size_of_the_chessboard - 1
    outer_loop_for_printing_the_chessboard:
      mov [s7], address_of_the_current_attempt + 1
      inner_loop_for_printing_the_chessboard:
        mov [s9], 'Q'
        fetch s8, s7
        mov al, [s8]
        mov ah, [s6]
        cmp al, ah
        jz queen_is_on_the_field
          mov [s9], '.'
        queen_is_on_the_field:
        call UART_TX
        add [s7], 1
        cmp [s7], address_of_the_current_attempt + 1 + size_of_the_chessboard
        jnz inner_loop_for_printing_the_chessboard
      end_of_inner_loop_for_printing_the_chessboard:
      mov [s9], 0xa
      call UART_TX
      sub [s6], 1
      jnc outer_loop_for_printing_the_chessboard
    end_of_outer_loop_for_printing_the_chessboard:
    dont_print_the_chessboard:
    
    jmp thats_the_solution_string$
      thats_the_solution_string db "That's the solution #", 0
    thats_the_solution_string$:
    mov [string_to_be_printed], thats_the_solution_string
    call print_string
    
    mov [regbank_b_s1], digits_of_the_ordinal_number
    increasing_the_ordinal_number_loop:
      fetch regbank_b_s0, regbank_b_s1
      add [regbank_b_s0], 1
      store regbank_b_s0, regbank_b_s1
      cmp [regbank_b_s0], '9' + 1
      jnz end_of_increasing_the_ordinal_number_loop
      mov [regbank_b_s0], '0'
      store regbank_b_s0, regbank_b_s1
      add [regbank_b_s1], 1
      jmp increasing_the_ordinal_number_loop
    end_of_increasing_the_ordinal_number_loop:

    mov al, [regbank_b_s1]
    mov ah, [regbank_b_s2]
    cmp al, ah
    jc not_a_new_digit
      mov al, [regbank_b_s1]
      mov [regbank_b_s2], al
    not_a_new_digit:

    mov al, [regbank_b_s2]
    mov [regbank_b_s1], al
    printing_the_ordinal_number:
      fetch s9, regbank_b_s1
      call UART_TX
      sub [regbank_b_s1], 1
      cmp [regbank_b_s1], digits_of_the_ordinal_number
      jnc printing_the_ordinal_number
    end_of_printing_the_ordinal_number:
    mov [s9], 0xa
    call UART_TX

    jmp end_of_branching
    
  not_a_solution:
    
    mov [row_of_the_queen_we_are_trying_to_add], size_of_the_chessboard - 1

    adding_a_new_queen_loop:
    if NDEBUG
      jmp dont_print_the_new_queen
    else
      jmp print_the_new_queen
    end if
    print_the_new_queen:
     jmp we_will_try_to_add_a_queen_at_the_field_string$
       we_will_try_to_add_a_queen_at_the_field_string db "We will try to add a queen at the field: ", 0
     we_will_try_to_add_a_queen_at_the_field_string$:
     mov [string_to_be_printed], we_will_try_to_add_a_queen_at_the_field_string
     call print_string

     mov al, [length_of_the_current_attempt]
     mov [s9], al
     add [s9], 'A'
     call UART_TX
     mov al, [row_of_the_queen_we_are_trying_to_add]
     mov [s9], al
     add [s9], '1'
     call UART_TX
     mov [s9], 0xa
     call UART_TX
    
    dont_print_the_new_queen:
     mov [s0], address_of_the_current_attempt + 1
     mov [s1], 0
     
     ;s2 will be the diagonal of the current attempt.
     mov al, [row_of_the_queen_we_are_trying_to_add]
     mov [s2], al
     mov al, [length_of_the_current_attempt]
     add [s2], al

     ;s3 will be the anti-diagonal of the current attempt.
     mov al, [row_of_the_queen_we_are_trying_to_add]
     mov [s3], al
     mov al, [length_of_the_current_attempt]
     sub [s3], al

     looping_through_current_attempt:
       mov al, [length_of_the_current_attempt]
       cmp [s1], al
       jz end_of_looping_through_current_attempt
       
       fetch s4, s0
       mov al, [row_of_the_queen_we_are_trying_to_add]
       cmp [s4], al
       jz queen_is_in_the_same_row
       
       mov al, [s4]
       mov [s5], al
       mov al, [s1]
       add [s5], al
       mov al, [s2]
       cmp [s5], al
       jz queen_is_on_the_same_diagonal

       mov al, [s4]
       mov [s6], al
       mov al, [s1]
       sub [s6], al
       mov al, [s3]
       cmp [s6], al
       jz queen_is_on_the_same_antidiagonal

       add [s0], 1
       add [s1], 1
       jmp looping_through_current_attempt
     end_of_looping_through_current_attempt:
     
     jmp add_the_new_queen

     queen_is_in_the_same_row:
       if NDEBUG 
         jmp dont_add_the_new_queen 
       else
         jmp print_the_first_debug_message
       end if
       print_the_first_debug_message:
       jmp there_is_a_queen_in_the_same_row_string$
         there_is_a_queen_in_the_same_row_string db "There is a queen in the same row, aborting!", 10, 0
       there_is_a_queen_in_the_same_row_string$:
       mov [string_to_be_printed], there_is_a_queen_in_the_same_row_string
       call print_string
       jmp dont_add_the_new_queen

     queen_is_on_the_same_diagonal:
       if NDEBUG 
         jmp dont_add_the_new_queen 
       else
         jmp print_the_second_debug_message
       end if
       print_the_second_debug_message:
       jmp there_is_a_queen_in_the_same_diagonal_string$
         there_is_a_queen_in_the_same_diagonal_string db "There is a queen on the same diagonal, aborting!", 10, 0
       there_is_a_queen_in_the_same_diagonal_string$:
       mov [string_to_be_printed], there_is_a_queen_in_the_same_diagonal_string
       call print_string
       jmp dont_add_the_new_queen

     queen_is_on_the_same_antidiagonal:
       if NDEBUG
         jmp dont_add_the_new_queen
       else
         jmp print_the_third_debug_message
       end if
       print_the_third_debug_message:
       jmp there_is_a_queen_on_the_same_antidiagonal$
         there_is_a_queen_on_the_same_antidiagonal db "There is a queen on the same anti-diagonal, aborting!", 10, 0
       there_is_a_queen_on_the_same_antidiagonal$:
       mov [string_to_be_printed], there_is_a_queen_on_the_same_antidiagonal
       call print_string
       jmp dont_add_the_new_queen     
     
     add_the_new_queen:
     if NDEBUG
       jmp dont_print_the_fourth_debug_message
     else
       jmp print_the_fourth_debug_message
     end if
     print_the_fourth_debug_message:
     jmp the_fourth_debug_message$
       the_fourth_debug_message db "Nothing seems to prevent that queen from being added!", 10, 0
     the_fourth_debug_message$:
     mov [string_to_be_printed], the_fourth_debug_message
     call print_string

     dont_print_the_fourth_debug_message:
     mov al, [top_of_the_stack]
     mov [s0], al
     mov al, [length_of_the_current_attempt]
     mov [s1], al
     add [s1], 1
     store s1, s0
     add [s0], 1
     mov [s1], 0
     copying_the_current_attempt_onto_stack:
       mov al, [length_of_the_current_attempt]
       cmp [s1], al
       jz end_of_copying_the_current_attempt_onto_stack
       mov [s2], address_of_the_current_attempt + 1
       mov al, [s1]
       add [s2], al
       fetch s3, s2
       store s3, s0
       add [s0], 1
       add [s1], 1
       jmp copying_the_current_attempt_onto_stack
     end_of_copying_the_current_attempt_onto_stack:
     store row_of_the_queen_we_are_trying_to_add, s0
     add [top_of_the_stack], size_of_the_chessboard + 1
    
     dont_add_the_new_queen:
     sub [row_of_the_queen_we_are_trying_to_add], 1
     jnc adding_a_new_queen_loop
   end_of_adding_a_new_queen_loop:
   if NDEBUG
     jmp end_of_branching
   else
     jmp adding_a_new_queen_exited_message
   end if
   adding_a_new_queen_exited_message:
   jmp the_adding_a_new_queen_exited_message_string$
     the_adding_a_new_queen_exited_message_string db "The `adding_a_new_queen_loop` loop exited!", 10, 0
   the_adding_a_new_queen_exited_message_string$:
   mov [string_to_be_printed], the_adding_a_new_queen_exited_message_string
   call print_string
  
  end_of_branching:

  jmp main_loop
end_of_the_main_loop:
  
jmp the_end_string$
  the_end_string db "The end!",10,0
the_end_string$:
mov [string_to_be_printed], the_end_string
call print_string



push the_long_output
call [puts]
invoke system,_pause
invoke exit,0

print_the_current_attempt:
  mov [s0], address_of_the_current_attempt + 1
  mov [s1], 0
  cmp [length_of_the_current_attempt], 0
  jnz printing_the_current_attempt_loop
    jmp empty_message_string$
      empty_message_string db "Empty", 0
    empty_message_string$:
    mov [string_to_be_printed], empty_message_string
    call print_string
    jmp end_of_printing_the_current_attempt_loop
  printing_the_current_attempt_loop:
    mov al, [length_of_the_current_attempt]
    cmp [s1], al
    jz end_of_printing_the_current_attempt_loop
    mov al, [s1]
    mov [s9], al
    add [s9], 'A'
    call UART_TX
    fetch s9, s0
    add [s9], '1'
    call UART_TX
    mov al, [length_of_the_current_attempt]
    mov [sb], al
    sub [sb], 1
    mov al, [sb]
    cmp [s1], al
    jz dont_print_the_trailing_space
      mov [s9], ' '
      call UART_TX
    dont_print_the_trailing_space:
    add [s0], 1
    add [s1], 1
    jmp printing_the_current_attempt_loop
  end_of_printing_the_current_attempt_loop:
  mov [s9], 0xa
  call UART_TX  
ret

UART_TX:
  mov al, [s9]
  sub al, 0
  jnz output_is_not_null
    push the_long_output
    push _error_message_2
    call [printf]
    invoke system, _pause
    invoke exit, 1
  output_is_not_null:
  mov ebx, [end_of_the_long_output]
  mov [the_long_output + ebx], al
  cmp [end_of_the_long_output], maximal_length_of_the_output
  jc output_is_of_fine_length
    push the_long_output
    push _error_message
    call [printf]
    invoke system, _pause
    invoke exit, 1
  output_is_of_fine_length:
  inc dword [end_of_the_long_output]
ret

print_string:
  mov edx, [string_to_be_printed]
  printing_string_loop:
    mov al, [edx]
    test al, al
    jz end_of_the_printing_string_loop
    mov [s9], al
    call UART_TX
    inc edx
    jmp printing_string_loop
  end_of_the_printing_string_loop:
ret


_pause db "PAUSE", 0
_error_message db "The program outputted more characters than allowed in the buffer. It outputted:",10,"%s", 10, 0
_error_message_2 db "The program tried to output a '\0' character! Before that, it outputted: ", 10 , "%s", 10, 0
section '.rdata' readable writable

the_long_output db maximal_length_of_the_output + 1 DUP(0)
end_of_the_long_output dd 0
s9 db ?
string_to_be_printed dd ?
linear_memory db 256 DUP(?)
regbank_b_s0 db ?
regbank_b_s1 db ?
regbank_b_s2 db ?
top_of_the_stack db ?
s0 db ?
s1 db ?
s2 db ?
s3 db ?
s4 db ?
s5 db ?
s6 db ?
s7 db ?
s8 db ?
sa db ?
sb db ?
sc db ?
sd db ?
se db ?
sf db ?
length_of_the_current_attempt db ?
row_of_the_queen_we_are_trying_to_add db ?

section '.idata' data readable import
library msvcrt,'msvcrt.dll' ;Microsoft Visual C Runtime Library
import msvcrt,printf,'printf',system,'system',exit,'exit',scanf,'scanf',puts,'puts'
