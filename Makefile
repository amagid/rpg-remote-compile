# Variables

libdir = /qsys.lib/$(LIB).lib

PGMS = $(libdir)/HELLO.PGM

rootdir = $(shell pwd)

ifndef LIB
	$(error Please define the LIB environment variable and try again)
endif

# Rules

all: $(PGMS)

# Programs

$(libdir)/HELLO.PGM: hello.rpgle
	system "CRTBNDRPG PGM($(LIB)/HELLO) SRCSTMF('$<')"

.PHONY: init
init:
	system "CRTLIB $(LIB)"

.PHONY: clean
clean:
	-system "DLTPGM PGM($(LIB)/HELLO)"